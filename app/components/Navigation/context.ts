import type { Ref } from 'vue';
import type Sortable from 'sortablejs';
import type { NavigationItem } from '~~/services/types/navigation-item.type';

export const NAV_TREE_CTX = Symbol('nav-tree-ctx');

export interface NavTreeContext {
  /** Максимальная глубина вложенности (уровни считаются с 1). */
  maxDepth: number;
  /** id узлов, ветки которых свёрнуты. */
  collapsed: Ref<Set<string>>;
  toggleCollapsed: (id: string) => void;
  /** Опции для `Sortable.create` каждого списка уровня (общий `group`). */
  sortableOptions: () => Sortable.Options;
  onEdit: (node: NavigationItem) => void;
  onCreateChild: (parentId: string) => void;
}
