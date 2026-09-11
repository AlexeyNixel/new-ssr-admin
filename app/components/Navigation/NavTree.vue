<script setup lang="ts">
import Sortable from 'sortablejs';
import NavTreeNode from './NavTreeNode.vue';
import type { NavigationItem } from '~~/services/types/navigation-item.type';
import {
  depthOfParent,
  findNodeAndParentList,
  subtreeHeight,
  type NavMoveEvent,
} from '~/composables/useNavTree';
import { NAV_TREE_CTX, type NavTreeContext } from './context';

const props = withDefaults(
  defineProps<{
    nodes: NavigationItem[];
    maxDepth?: number;
  }>(),
  { maxDepth: 5 }
);

const emit = defineEmits<{
  move: [NavMoveEvent];
  edit: [NavigationItem];
  'create-child': [string];
}>();

const toast = useToast();

/* ---- сворачивание веток (+ persist в localStorage) ---- */
const STORAGE_KEY = 'nav-tree-collapsed';
const collapsed = ref<Set<string>>(new Set());

onMounted(() => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) collapsed.value = new Set(JSON.parse(raw) as string[]);
  } catch {
    /* ignore */
  }
});

watch(
  collapsed,
  (value) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([...value]));
    } catch {
      /* ignore */
    }
  },
  { deep: true }
);

const toggleCollapsed = (id: string) => {
  const next = new Set(collapsed.value);
  if (next.has(id)) next.delete(id);
  else next.add(id);
  collapsed.value = next;
};

const allIds = (nodes: NavigationItem[]): string[] =>
  nodes.flatMap((n) => [n.id, ...allIds(n.children ?? [])]);

const collapseAll = () => {
  collapsed.value = new Set(allIds(props.nodes));
};
const expandAll = () => {
  collapsed.value = new Set();
};
defineExpose({ collapseAll, expandAll });

/* ---- drag & drop ---- */
const projectedDepth = (id: string, toParentId: string): number | null => {
  const found = findNodeAndParentList(props.nodes, id);
  if (!found) return null;
  return depthOfParent(props.nodes, toParentId) + subtreeHeight(found.node);
};

const onSortMove = (evt: Sortable.MoveEvent): boolean => {
  const toParentId = (evt.to as HTMLElement).dataset.parentId ?? '';
  const id = (evt.dragged as HTMLElement).dataset.id ?? '';
  const projected = projectedDepth(id, toParentId);
  return projected == null || projected <= props.maxDepth;
};

const onSortEnd = (evt: Sortable.SortableEvent) => {
  const { from, to, oldIndex, newIndex, item } = evt;
  if (oldIndex == null || newIndex == null) return;

  // Откатываем DOM-перемещение — источник правды это модель.
  from.insertBefore(item, from.children[oldIndex] ?? null);

  const fromParentId = (from as HTMLElement).dataset.parentId ?? '';
  const toParentId = (to as HTMLElement).dataset.parentId ?? '';
  if (fromParentId === toParentId && oldIndex === newIndex) return;

  const id = (item as HTMLElement).dataset.id ?? '';
  if (!id) return;

  const projected = projectedDepth(id, toParentId);
  if (projected != null && projected > props.maxDepth) {
    toast.add({
      title: `Максимум ${props.maxDepth} уровней вложенности`,
      color: 'warning',
    });
    return;
  }

  emit('move', { id, fromParentId, toParentId, oldIndex, newIndex });
};

const sortableOptions = (): Sortable.Options => ({
  group: 'nav-tree',
  handle: '.nav-drag-handle',
  animation: 150,
  fallbackOnBody: true,
  invertSwap: true,
  emptyInsertThreshold: 10,
  onMove: onSortMove,
  onEnd: onSortEnd,
});

provide<NavTreeContext>(NAV_TREE_CTX, {
  maxDepth: props.maxDepth,
  collapsed,
  toggleCollapsed,
  sortableOptions,
  onEdit: (node) => emit('edit', node),
  onCreateChild: (parentId) => emit('create-child', parentId),
});

const rootEl = ref<HTMLElement | null>(null);
let sortable: Sortable | null = null;

onMounted(() => {
  if (rootEl.value) sortable = Sortable.create(rootEl.value, sortableOptions());
});
onBeforeUnmount(() => {
  sortable?.destroy();
  sortable = null;
});
</script>

<template>
  <div>
    <ul ref="rootEl" data-parent-id="" class="space-y-0.5">
      <NavTreeNode
        v-for="node in nodes"
        :key="node.id"
        :node="node"
        :depth="1"
      />
    </ul>

    <p
      v-if="!nodes.length"
      class="text-sm text-neutral-400 px-2 py-10 text-center"
    >
      Пунктов навигации пока нет
    </p>
  </div>
</template>
