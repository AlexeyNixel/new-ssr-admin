# Навигация: дерево с nested drag-and-drop + переделка модалки

Дата: 2026-09-10
Ветка: task-7 (текущая)

## Проблема

Раздел «Управление навигацией» (`app/pages/navigation/index.vue`) сейчас:

- Рендерит `UTable` с sub-rows. `useSortable('.my-table-tbody', navigationsItems)`
  делает перетаскиваемыми **только строки верхнего уровня** — вложенные пункты
  (подменю) переставить нельзя.
- `handleDragItem` пересчитывает `order` только для плоского массива верхнего
  уровня.
- После каждого перетаскивания перезапрашивает всё дерево → мигание.
- Модалка `AdminNavigation.vue`: `<UForm>` без `:schema` и `:state` — валидация
  не работает; `name` полей не совпадают с моделью (`link` vs `to`, `position` vs
  `order`); поле «Позиция» (ручной ввод `order`) избыточно; выбор иконки — ручной
  ввод строки `i-heroicons-home`.

## Цель

- Перетаскивание работает на **всех уровнях** вложенности.
- Перетаскиванием можно **менять порядок** и **менять родителя** (перенести пункт
  в другое подменю / на верхний уровень).
- Отзывчивый UI: оптимистичное перемещение, фоновое сохранение, откат при ошибке.
- Ограничение вложенности — **5 уровней**.
- Модалка: рабочая валидация, без поля «Позиция», удобный выбор иконки.
- Удаление пунктов — **вне scope** (в API нет эндпоинта, не добавляем).

## Ограничения API (не меняем бэкенд)

`services/api/navigation.api.ts`:

- `getAllNavigation()` → дерево `NavigationItem[]` (с `children`).
- `getAllNavigationWithoutTree()` → плоский список.
- `update(id, Partial<NavigationItem>)` → `PATCH /api/navigation-item/:id`.
  Принимает `parentId` (строка; `''` = корень — текущая конвенция в коде).
- `updateBatchOrder(data)` → `POST /api/navigation-item/batch-update`, тело
  `{ data: [{ id, order }] }`. **Принимает только `id` + `order`.**
- `create(data)`, `getOneNavigation(id)`.

Следствие: смена родителя при drop = отдельный `update(id, { parentId })` +
`updateBatchOrder` для пересчёта `order` затронутых списков соседей.

## Модель данных

```ts
interface NavigationItem {
  id: string;
  title: string;
  description: string;
  icon: string;
  order: number;
  parentId?: string;      // '' или undefined = корень
  target: string;         // '_blank' | '_self'
  isExternal: boolean;
  children: NavigationItem[];
}
```

Источник правды на странице — реактивное дерево `tree = ref<NavigationItem[]>`
(из `getAllNavigation`). После drop SortableJS-перемещение DOM **откатывается**
(`onEnd` возвращает узел на исходное место), затем мутируется модель — Vue
перерисовывает из модели штатно. Ре-ключ не используется (иначе сбрасывалось бы
раскрытие веток и пересоздавались Sortable-инстансы).

## Компоненты

### `app/components/Navigation/NavTree.vue`

- Пропсы: `nodes: NavigationItem[]`, `maxDepth = 5`.
- Эмиты: `move`, `edit`, `create-child`.
- Рендерит корневой `<ul data-parent-id="">` + `NavTreeNode` для каждого узла.
- Держит `Map<parentId, Sortable>`? Нет — Sortable создаётся внутри каждого
  `NavTreeNode` для его списка детей и на корневом `<ul>` здесь.
- `group: 'nav-tree'`, `handle: '.nav-drag-handle'`, `animation: 150`,
  `fallbackOnBody: true`, `invertSwap: true`.
- `onEnd(evt)`:
  - `id = evt.item.dataset.id`
  - `fromParentId = evt.from.dataset.parentId ?? ''`
  - `toParentId = evt.to.dataset.parentId ?? ''`
  - `oldIndex = evt.oldIndex`, `newIndex = evt.newIndex`
  - **Всегда** откатываем DOM-перемещение (и для того же списка, и для другого):
    `evt.from.insertBefore(evt.item, evt.from.children[evt.oldIndex] ?? null)`.
  - Если `fromParentId === toParentId && oldIndex === newIndex` — выходим.
  - Проверка глубины: `depthHelpers.depthOfParent(tree, toParentId) +
    depthHelpers.subtreeHeight(node) > maxDepth` → тост «Максимум 5 уровней
    вложенности», выходим.
  - Иначе эмит `move` со всеми полями выше. Модель мутирует `useNavTree.applyMove`,
    Vue перерисовывает из модели.
- `onMove(evt)` (SortableJS) — визуально запрещаем дроп глубже 5 уровней
  (`return false`), чтобы не мигало. Использует те же хелперы глубины.
- Хелперы глубины (`depthOfParent`, `subtreeHeight`, `findNodeAndParentList`)
  экспортируются из `useNavTree.ts` и импортируются в `NavTree.vue`.

### `app/components/Navigation/NavTreeNode.vue`

- Пропсы: `node: NavigationItem`, `depth: number`, `maxDepth: number`.
- Эмиты (пробрасываются в NavTree): `edit`, `create-child`.
- Разметка строки:
  - drag-ручка `.nav-drag-handle` (иконка `i-lucide-grip-vertical`), `cursor-grab`
  - кнопка сворачивания (если есть `children`) — `i-lucide-chevron-right`,
    поворот на 90° при раскрытии
  - `<Icon :name="node.icon">`
  - `node.title`
  - бейджи: «Внешняя»/«Внутренняя» (по `isExternal`), target `_blank`/`_self`
  - справа: `+ подпункт` (эмит `create-child` с `node.id`; скрыта на уровне
    `depth === maxDepth`), `Редактировать` (эмит `edit` с `node`)
- Отступ уровня: `padding-left` по `depth`.
- Вложенный `<ul :data-parent-id="node.id">` — виден при раскрытии, `min-height`
  ~2rem даже пустой (зона дропа), пунктирная рамка при `dragover`.
- `Sortable.create` на этом `<ul>` в `onMounted`, `destroy` в `onBeforeUnmount`.
- Рекурсивно рендерит `NavTreeNode` для `node.children` с `depth + 1`.
- Состояние раскрытия: `useState`/локально + опционально persist в `localStorage`
  по id (ключ `nav-tree-expanded`).

### `app/composables/useNavTree.ts`

Логика мутации дерева + персиста. Возвращает `{ tree, saving, reload, applyMove }`.

```ts
applyMove({ id, fromParentId, toParentId, oldIndex, newIndex }) {
  // 1. найти узел + его текущий список (siblings источника)
  // 2. splice из источника, splice в целевой список на newIndex
  // 3. node.parentId = toParentId
  // 4. пересчитать order в целевом (и, если отличается, в исходном) списке
  // 5. persist() в фоне
}

async persist({ movedId, parentChanged, destList, sourceList }) {
  saving = true
  try {
    if (parentChanged) await api.update(movedId, { parentId: toParentId })  // '' для корня
    await api.updateBatchOrder(destList.map((n, i) => ({ id: n.id, order: i + 1 })))
    if (sourceList) await api.updateBatchOrder(sourceList.map((n, i) => ({ id: n.id, order: i + 1 })))
  } catch {
    toast.add({ title: 'Не удалось сохранить порядок', color: 'error' })
    await reload()   // откат к серверу
  } finally { saving = false }
}
```

Хелперы (экспортируются, используются и в `NavTree.vue`):
`findNodeAndParentList(tree, id)`, `depthOfParent(tree, parentId)`,
`subtreeHeight(node)`.

`getAllNavigation` в `getWithoutPagination` не поддерживает параметр `withoutDate`
(игнорируется) — вызываем без аргументов.

### `app/pages/navigation/index.vue`

- Убрать `UTable`, `useSortable`, `columns`, `handleDragItem`.
- `const { tree, saving, reload, applyMove } = useNavTree()`.
- `<NuxtLayout name="table" title="Управление навигацией" :event-create="() => openModal()">`
  - в шапку рядом с заголовком — индикатор `saving` («Сохранение…» + спиннер),
    кнопки «Развернуть всё» / «Свернуть всё».
  - `<NavTree :nodes="tree" @move="applyMove" @edit="openModal" @create-child="openCreateChild" />`
- `openModal(node?)` — как сейчас (проп `navigationItem`), после `result` →
  `reload()`.
- `openCreateChild(parentId)` — `modal.open({ parentId })`, после `result` →
  `reload()`.
- `useModalRouteOpener({ modal, onClosed: reload })` — без изменений.

## Модалка `AdminNavigation.vue`

### Схема `app/schemas/navigation.schema.ts` (новый)

```ts
import { z } from 'zod';

export const navigationSchema = z.object({
  title: z.string('Обязательное поле').min(1, 'Обязательное поле'),
  to: z.string('Обязательное поле').min(1, 'Обязательное поле'),
  target: z.string('Выберите тип').min(1, 'Выберите тип'),
  description: z.string().optional(),
  icon: z.string().optional(),
  parentId: z.string().optional(),
});
```

### Скрипт

- Добавить проп `parentId?: string` (для «+ подпункт»).
- `useModalEntity` — без изменений (уже подключён из предыдущей задачи).
- Стейт формы: `title, description, to, icon, target, parentId`. **Убрать `order`
  и `slug`.**
- В `watch(navigationItem, …)` — заполнять только оставшиеся поля.
- Инициализация `parentId`: `navigationItem?.parentId ?? props.parentId ?? ''`.
- `onSubmit`:
  - при создании `order` = кол-во элементов в `navItems` с таким же `parentId`,
    плюс 1 (`navItems` уже грузится).
  - `<UForm :schema="navigationSchema" :state="newNavigationItem" @submit>`.

### Шаблон

- Подключить `:schema` / `:state` к `<UForm>`.
- Исправить `name`: `link` → `to`. Убрать `UFormField` «Позиция».
- Иконка: оставить текст-инпут с живым превью **+** `UPopover` с гридом ~40
  частых иконок (`NAV_ICON_PRESETS` — массив строк вида `i-heroicons-home`,
  константа в `app/constants/nav-icons.ts`). Клик по иконке — `newNavigationItem.icon = ...`.
- Кнопки: оставить как есть (submit). Ветки `pending`/`notFound` уже есть.

## Изменения в API-слое

`services/api/navigation.api.ts`:

- Тип `updateBatchOrder(data: { id: string; order: number }[])` — оставить.
- `update` уже `Partial<NavigationItem>` — ок для `{ parentId }`.
- Ничего структурно не меняем.

## Крайние случаи

- Перенос узла с детьми: `parentId` меняем только у самого узла; дети едут с ним
  (в дереве это поддерево). `order` детей не трогаем.
- Дроп в тот же список на то же место (`from === to && oldIndex === newIndex`) —
  `applyMove` выходит сразу.
- Превышение глубины — блокируется в `onMove` (визуально) и повторно
  проверяется в `onEnd`.
- Ошибка сети при персисте — тост + полный `reload()`.
- `parentId: ''` для корня — если бэкенд не примет пустую строку, переключить на
  `null` (одно место в `persist`). **Проверить на реальном бэке.**

## Тестирование

Тестов в проекте нет. Ручная проверка на `localhost` (нужен вход):

1. Перетащить пункт верхнего уровня — порядок сохранился после перезагрузки.
2. Перетащить вложенный пункт внутри своего подменю — порядок сохранился.
3. Перетащить пункт из одного подменю в другое — сменился родитель + порядок.
4. Перетащить вложенный пункт на верхний уровень — `parentId` стал корневым.
5. Попытка вложить глубже 5 уровней — блокируется с тостом.
6. Модалка: пустой `title`/`to` — ошибки валидации; выбор иконки из грида
   применяется; поля «Позиция» нет.
7. «+ подпункт» у узла — создаётся с правильным `parentId`.
8. `/navigation?editId=<id>` — открывает модалку редактирования (не сломано).

## Файлы

Новые:

- `app/components/Navigation/NavTree.vue`
- `app/components/Navigation/NavTreeNode.vue`
- `app/composables/useNavTree.ts`
- `app/schemas/navigation.schema.ts`
- `app/constants/nav-icons.ts`

Изменяемые:

- `app/pages/navigation/index.vue`
- `app/components/Modals/AdminNavigation.vue`
- `docs/deep-links.md` (упоминание navigation модалки — при необходимости)
- `CLAUDE.md` (раздел про навигацию/DnD)

Удаляется использование: `useSortable` из `@vueuse/integrations` на этой странице
(зависимость остаётся, вдруг нужна ещё где-то — grep показал только эту страницу).
