/**
 * Картинки при ИИ-обработке текста.
 *
 * Проблема: в модель уходит только plain text (`doc.textBetween`), а результат
 * вставляется через `setContent()` — загруженные фотографии из статьи исчезают.
 *
 * Решение: перед отправкой заменяем каждую картинку меткой
 * `[[ФОТО 1: подпись]]`, модель переставляет метки по смыслу текста, а после
 * ответа возвращаем на их место исходный HTML картинки (с шириной и alt).
 * Если модель метку потеряла — возвращаем фото к абзацу, рядом с которым оно
 * стояло в оригинале, иначе в конец статьи.
 */

export const AI_IMAGE_MARKER = /\[{1,2}\s*ФОТО\s+(\d+)(?:\s*:[^\]]*)?\s*\]{1,2}/gi;

export interface AiImage {
  /** Номер метки, с 1 */
  index: number;
  /** Готовый HTML картинки из редактора (src, alt, ширина) */
  html: string;
  /** Подпись/alt — попадает в метку, чтобы модель понимала, о чём фото */
  caption: string;
  /** Текст перед картинкой — запасной якорь, если модель потеряет метку */
  anchor: string;
}

export interface AiSource {
  /** Текст с метками вместо картинок */
  text: string;
  images: AiImage[];
}

/** Минимум от ProseMirror-документа, который нужен для сбора текста и картинок. */
interface PmNodeLike {
  type: { name: string };
  attrs: Record<string, unknown>;
}

interface PmDocLike {
  content: { size: number };
  // eslint-disable-next-line @typescript-eslint/no-invalid-void-type -- точная сигнатура prosemirror-model
  descendants(callback: (node: PmNodeLike, pos: number) => boolean | void): void;
  textBetween(
    from: number,
    to: number,
    blockSeparator?: string,
    leafText?: string | ((node: PmNodeLike) => string)
  ): string;
}

export interface AiEditorLike {
  state: { doc: PmDocLike };
  getHTML(): string;
}

const normalize = (value: string) => value.replace(/\s+/g, ' ').trim();

const cleanCaption = (value: string) => normalize(value).replace(/[[\]]/g, '').slice(0, 120);

/** Все позиции картинок в документе — в порядке следования. */
function imagePositions(editor: AiEditorLike): number[] {
  const positions: number[] = [];

  editor.state.doc.descendants((node, pos) => {
    if (node.type.name === 'image') {
      positions.push(pos);
      return false;
    }
    return true;
  });

  return positions;
}

/** HTML картинок в том же порядке, что и в документе. */
function imageHtml(editor: AiEditorLike): string[] {
  if (typeof DOMParser === 'undefined') return [];

  const dom = new DOMParser().parseFromString(editor.getHTML(), 'text/html');
  return Array.from(dom.body.querySelectorAll('img')).map((img) => img.outerHTML);
}

/**
 * Текст фрагмента для модели + найденные в нём картинки.
 * `from`/`to` — позиции ProseMirror (0 и `doc.content.size` для всего документа).
 */
export function captureAiSource(editor: AiEditorLike, from: number, to: number): AiSource {
  const { doc } = editor.state;
  const start = Math.max(0, Math.min(from, to));
  const end = Math.min(doc.content.size, Math.max(from, to));

  const positions = imagePositions(editor);
  const html = imageHtml(editor);
  const inScope = positions.filter((pos) => pos >= start && pos < end);

  const images: AiImage[] = [];
  let seen = 0;

  const text = doc.textBetween(start, end, '\n\n', (node) => {
    if (node.type.name !== 'image') return '';

    const pos = inScope[seen++];
    const globalIndex = pos === undefined ? -1 : positions.indexOf(pos);
    const caption = cleanCaption(String(node.attrs?.alt ?? node.attrs?.title ?? ''));
    const anchor = normalize(
      pos === undefined ? '' : doc.textBetween(Math.max(0, pos - 400), Math.max(0, pos), ' ', '')
    ).slice(-80);

    images.push({
      index: images.length + 1,
      html: globalIndex >= 0 ? (html[globalIndex] ?? '') : '',
      caption,
      anchor,
    });

    const label = caption ? `: ${caption}` : '';
    return `[[ФОТО ${images.length}${label}]]`;
  });

  return { text, images };
}

/** Внутри ли абзаца находится позиция (по уже собранной строке HTML). */
function insideParagraph(html: string, offset: number): boolean {
  const before = html.slice(0, offset);
  const open = Math.max(before.lastIndexOf('<p>'), before.lastIndexOf('<p '));
  const closed = before.lastIndexOf('</p>');
  return open > closed;
}

/** Вставить картинку после абзаца, в котором встречается якорь. */
function insertAfterAnchor(html: string, image: AiImage): string | null {
  const anchor = normalize(image.anchor).slice(-40);
  if (anchor.length < 12) return null;

  const paragraph = /<p\b[^>]*>[\s\S]*?<\/p>/gi;
  let match: RegExpExecArray | null;

  while ((match = paragraph.exec(html))) {
    const plain = normalize(match[0].replace(/<[^>]+>/g, ' '));
    if (!plain.includes(anchor)) continue;

    const cut = match.index + match[0].length;
    return `${html.slice(0, cut)}\n${image.html}\n${html.slice(cut)}`;
  }

  return null;
}

/**
 * Вернуть картинки в готовый HTML ответа модели.
 * Метки заменяются исходным HTML; потерянные фото вставляются по якорю или в конец.
 */
export function injectAiImages(html: string, images: AiImage[]): string {
  if (!images.length) return html;

  const byIndex = new Map(images.map((image) => [image.index, image]));
  const used = new Set<number>();

  let out = html.replace(AI_IMAGE_MARKER, (marker, num: string, offset: number) => {
    const image = byIndex.get(Number(num));
    if (!image || !image.html || used.has(image.index)) {
      return '';
    }

    used.add(image.index);

    // Метка внутри абзаца — разрываем абзац, чтобы картинка стала блоком
    return insideParagraph(html, offset)
      ? `</p>\n${image.html}\n<p>`
      : `\n${image.html}\n`;
  });

  for (const image of images) {
    if (used.has(image.index) || !image.html) continue;
    out = insertAfterAnchor(out, image) ?? `${out}\n${image.html}`;
  }

  return out
    .replace(/<p>\s*<\/p>/gi, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/** Текст без меток — для режимов, которые возвращают plain text (анонс). */
export const stripImageMarkers = (text: string) =>
  text.replace(AI_IMAGE_MARKER, '').replace(/\n{3,}/g, '\n\n').trim();
