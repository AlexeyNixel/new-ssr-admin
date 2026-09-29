import { Extension } from '@tiptap/core';
import type { Node as ProseMirrorNode } from '@tiptap/pm/model';
import { Plugin, PluginKey, type EditorState, type Transaction } from '@tiptap/pm/state';
import { selectedRect, TableMap, type TableRect } from '@tiptap/pm/tables';
import type { EditorView } from '@tiptap/pm/view';
import { TableCell, TableHeader, TableView } from '@tiptap/extension-table';

/*
 * Ширина столбцов таблицы в px или %.
 *
 * px — штатный атрибут ячейки `colwidth` (его же пишет перетаскивание границы),
 * он попадает в <col style="width: …px">.
 * % — наш атрибут `colpercent` (массив на каждый столбец под ячейкой, как
 * colwidth): рендерится в `style="width: …%"` самой ячейки, а <col> у такого
 * столбца остаётся без ширины. При table-layout: fixed браузер берёт ширину
 * столбца из <col>, а если её нет — из ячейки первой строки, так что проценты
 * считаются от ширины таблицы и не ломаются во время перетаскивания соседей.
 */

export type ColumnWidthUnit = 'px' | '%';

type Widths = (number | null)[] | null;

const hasAny = (list: Widths) => !!list?.some((v) => !!v);

const parseList = (value: string | null) => {
  if (!value) return null;
  const list = value.split(',').map((v) => {
    const n = parseFloat(v);
    return Number.isFinite(n) && n > 0 ? n : 0;
  });
  return list.some(Boolean) ? list : null;
};

const colpercentAttribute = {
  colpercent: {
    default: null,
    parseHTML: (element: HTMLElement) => parseList(element.getAttribute('data-colpercent')),
    renderHTML: (attrs: Record<string, unknown>) => {
      const list = attrs.colpercent as Widths;
      if (!hasAny(list)) return {};

      const out: Record<string, string> = {
        'data-colpercent': list!.map((v) => v || 0).join(','),
      };
      // Ширину ячейке ставим, только если известны все её столбцы (colspan)
      if (list!.length === ((attrs.colspan as number) ?? 1) && list!.every(Boolean)) {
        const sum = list!.reduce<number>((acc, v) => acc + (v || 0), 0);
        out.style = `width: ${+sum.toFixed(2)}%`;
      }
      return out;
    },
  },
};

export const TableCellWithWidth = TableCell.extend({
  addAttributes() {
    return { ...this.parent?.(), ...colpercentAttribute };
  },
});

export const TableHeaderWithWidth = TableHeader.extend({
  addAttributes() {
    return { ...this.parent?.(), ...colpercentAttribute };
  },
});

/*
 * Штатный updateColumns у столбца без px-ширины ставит только min-width и не
 * снимает width, оставшийся от перетаскивания, — столбец «залипает» в px.
 */
export class FluidTableView extends TableView {
  constructor(node: ProseMirrorNode, cellMinWidth: number) {
    super(node, cellMinWidth);
    this.clearStaleWidths();
  }

  override update(node: ProseMirrorNode) {
    const ok = super.update(node);
    if (ok) this.clearStaleWidths();
    return ok;
  }

  private clearStaleWidths() {
    const row = this.node.firstChild;
    if (!row) return;

    let col = this.colgroup.firstElementChild as HTMLElement | null;
    for (let i = 0; i < row.childCount && col; i += 1) {
      const { colspan, colwidth } = row.child(i).attrs;
      for (let j = 0; j < colspan && col; j += 1) {
        if (!colwidth?.[j]) col.style.removeProperty('width');
        col = col.nextElementSibling as HTMLElement | null;
      }
    }
  }
}

type ColumnWidth = { px: number | null; percent: number | null };

const normalize = (list: (number | null)[]) =>
  list.some((v) => !!v) ? list.map((v) => v || 0) : null;

const setAt = (list: Widths, colspan: number, index: number, value: number | null) => {
  const next = Array.from({ length: colspan }, (_, i) => list?.[i] || 0) as (number | null)[];
  next[index] = value || 0;
  return normalize(next);
};

/** Проставляет ширину столбцам [from, to) таблицы. */
function setColumnsWidth(
  tr: Transaction,
  rect: Pick<TableRect, 'map' | 'tableStart'>,
  from: number,
  to: number,
  widthOf: (col: number) => ColumnWidth,
) {
  const { map, tableStart } = rect;
  const seen = new Set<string>();

  for (let col = from; col < to; col += 1) {
    const { px, percent } = widthOf(col);

    for (let row = 0; row < map.height; row += 1) {
      const pos = map.map[row * map.width + col]!;
      const index = col - map.colCount(pos);
      const key = `${pos}:${index}`;
      if (seen.has(key)) continue;
      seen.add(key);

      // Ячейку читаем из tr.doc: её атрибуты могли измениться на прошлом столбце
      const cellPos = tr.mapping.map(tableStart + pos);
      const cell = tr.doc.nodeAt(cellPos);
      if (!cell) continue;
      const { colspan } = cell.attrs;

      tr.setNodeMarkup(cellPos, null, {
        ...cell.attrs,
        colwidth: setAt(cell.attrs.colwidth, colspan, index, px),
        colpercent: setAt(cell.attrs.colpercent, colspan, index, percent),
      });
    }
  }
  return tr;
}

const clampPercent = (v: number) => Math.min(100, Math.max(1, +v.toFixed(2)));

/** Ширина столбца по первой строке: [px, %]. */
const columnWidthAt = ({ map, table }: Pick<TableRect, 'map' | 'table'>, col: number) => {
  const pos = map.map[col]!;
  const cell = table.nodeAt(pos);
  const index = col - map.colCount(pos);
  return [cell?.attrs.colwidth?.[index] || 0, cell?.attrs.colpercent?.[index] || 0] as const;
};

const outside = (rect: TableRect) =>
  Array.from({ length: rect.map.width }, (_, col) => col).filter(
    (col) => col < rect.left || col >= rect.right,
  );

/** Столбцы вне выделения с шириной в px: [столбец, px]. */
const pxColumnsOutside = (rect: TableRect) =>
  outside(rect)
    .map((col) => [col, columnWidthAt(rect, col)[0]] as const)
    .filter(([, px]) => px > 0);

/** Сумма процентов у столбцов вне выделения. */
const percentOutside = (rect: TableRect) =>
  outside(rect).reduce((acc, col) => acc + columnWidthAt(rect, col)[1], 0);

const rectOf = (state: EditorState): TableRect | null => {
  try {
    return selectedRect(state);
  } catch {
    return null; // курсор не в таблице
  }
};

/** Ширина столбца, в котором стоит курсор (или первого из выделенных). */
export function getCurrentColumnWidth(state: EditorState) {
  const rect = rectOf(state);
  if (!rect) return null;
  const [px, percent] = columnWidthAt(rect, rect.left);
  return { px: px || null, percent: percent || null, count: rect.right - rect.left };
}

/** Сумма процентных ширин по всем столбцам таблицы (для подсказки). */
export function getTablePercentTotal(state: EditorState) {
  const rect = rectOf(state);
  if (!rect) return 0;
  let total = 0;
  for (let col = 0; col < rect.map.width; col += 1) total += columnWidthAt(rect, col)[1];
  return +total.toFixed(2);
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    tableColumnWidth: {
      /** Ширина выделенных столбцов; null — «авто». */
      setColumnWidth: (width: number | null, unit?: ColumnWidthUnit) => ReturnType;
      /** Все столбцы поровну в процентах. */
      distributeColumns: () => ReturnType;
      /** Сбросить ширины — таблица снова тянется на всю ширину. */
      resetColumnWidths: () => ReturnType;
    };
  }
}

const tableColumnWidthKey = new PluginKey('tableColumnWidth');

export const TableColumnWidth = Extension.create({
  name: 'tableColumnWidth',

  addCommands() {
    return {
      setColumnWidth:
        (width, unit = '%') =>
        ({ state, tr, dispatch }) => {
          const rect = rectOf(state);
          if (!rect) return false;
          if (dispatch) {
            const value = width && width > 0 ? width : null;
            const px = unit === 'px' && value ? Math.round(value) : null;
            const percent = unit === '%' && value ? clampPercent(value) : null;

            // Смесь px и % непредсказуема: при сумме процентов < 100 браузер
            // раздувает и px-столбцы, а широкие px съедают проценты. Поэтому
            // px → остальные %-столбцы становятся «авто» (делят остаток),
            // % → остальные px-столбцы делят оставшиеся проценты пропорционально.
            if (px) {
              for (const col of outside(rect)) {
                if (columnWidthAt(rect, col)[1]) {
                  setColumnsWidth(tr, rect, col, col + 1, () => ({ px: null, percent: null }));
                }
              }
            }

            const others = percent ? pxColumnsOutside(rect) : [];
            if (percent && others.length) {
              const selected = percent * (rect.right - rect.left);
              const free = 100 - selected - percentOutside(rect);
              const pxTotal = others.reduce((acc, [, w]) => acc + w, 0);
              for (const [col, w] of others) {
                const share = free > 0 ? clampPercent((free * w) / pxTotal) : null;
                setColumnsWidth(tr, rect, col, col + 1, () => ({ px: null, percent: share }));
              }
            }

            setColumnsWidth(tr, rect, rect.left, rect.right, () => ({ px, percent }));
          }
          return true;
        },

      distributeColumns:
        () =>
        ({ state, tr, dispatch }) => {
          const rect = rectOf(state);
          if (!rect) return false;
          if (dispatch) {
            const percent = +(100 / rect.map.width).toFixed(2);
            setColumnsWidth(tr, rect, 0, rect.map.width, () => ({ px: null, percent }));
          }
          return true;
        },

      resetColumnWidths:
        () =>
        ({ state, tr, dispatch }) => {
          const rect = rectOf(state);
          if (!rect) return false;
          if (dispatch) {
            setColumnsWidth(tr, rect, 0, rect.map.width, () => ({ px: null, percent: null }));
          }
          return true;
        },
    };
  },

  /*
   * Перетаскивание границы (prosemirror-tables) всегда пишет px в colwidth.
   * Если столбец был в процентах — пересчитываем результат обратно в % от
   * текущей ширины таблицы, чтобы столбец не переключался молча в px.
   */
  addProseMirrorPlugins() {
    let view: EditorView | null = null;

    return [
      new Plugin({
        key: tableColumnWidthKey,
        view(editorView) {
          view = editorView;
          return { destroy: () => (view = null) };
        },
        appendTransaction(trs, _oldState, newState) {
          if (!view || !trs.some((t) => t.docChanged)) return null;
          if (trs.some((t) => t.getMeta(tableColumnWidthKey))) return null;

          const tr = newState.tr;

          newState.doc.descendants((node, pos) => {
            if (node.type.spec.tableRole !== 'table') return !node.isTextblock;

            const map = TableMap.get(node);
            const rect = { map, table: node, tableStart: pos + 1 };
            // столбец → [новая ширина в px, прежние %]
            const convert = new Map<number, readonly [number, number]>();

            for (let col = 0; col < map.width; col += 1) {
              const [px, percent] = columnWidthAt(rect, col);
              if (px && percent) convert.set(col, [px, percent]);
            }
            if (!convert.size) return false;

            const dom = view!.nodeDOM(pos) as HTMLElement | null;
            const tableEl = dom?.tagName === 'TABLE' ? dom : dom?.querySelector('table');
            const tableWidth = tableEl?.getBoundingClientRect().width;

            for (const [col, [px, before]] of convert) {
              if (!tableWidth) {
                setColumnsWidth(tr, rect, col, col + 1, () => ({ px, percent: null }));
                continue;
              }
              const percent = clampPercent((px / tableWidth) * 100);
              setColumnsWidth(tr, rect, col, col + 1, () => ({ px: null, percent }));

              // Разницу отдаём соседу справа, чтобы сумма процентов не менялась
              // (иначе браузер растянет/сожмёт все столбцы разом)
              const next = col + 1;
              const nextPercent = next < map.width ? columnWidthAt(rect, next)[1] : 0;
              if (nextPercent && !convert.has(next)) {
                const adjusted = clampPercent(nextPercent + before - percent);
                setColumnsWidth(tr, rect, next, next + 1, () => ({ px: null, percent: adjusted }));
              }
            }
            return false;
          });

          if (!tr.docChanged) return null;
          return tr.setMeta(tableColumnWidthKey, true);
        },
      }),
    ];
  },
});
