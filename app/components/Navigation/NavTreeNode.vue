<script setup lang="ts">
import Sortable from 'sortablejs';
import type { NavigationItem } from '~~/services/types/navigation-item.type';
import { NAV_TREE_CTX, type NavTreeContext } from './context';

const props = defineProps<{
  node: NavigationItem;
  depth: number;
}>();

const ctx = inject<NavTreeContext>(NAV_TREE_CTX)!;

const hasChildren = computed(() => (props.node.children?.length ?? 0) > 0);
const isCollapsed = computed(() => ctx.collapsed.value.has(props.node.id));
const canHaveChildren = computed(() => props.depth < ctx.maxDepth);

const sublistEl = ref<HTMLElement | null>(null);
let sortable: Sortable | null = null;

onMounted(() => {
  if (sublistEl.value) {
    sortable = Sortable.create(sublistEl.value, ctx.sortableOptions());
  }
});

onBeforeUnmount(() => {
  sortable?.destroy();
  sortable = null;
});
</script>

<template>
  <li :data-id="node.id" class="select-none">
    <div
      class="group flex items-center gap-2 rounded-lg px-2 py-2 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors"
    >
      <UButton
        class="nav-drag-handle cursor-grab active:cursor-grabbing text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
        color="neutral"
        variant="ghost"
        size="xs"
        icon="i-lucide-grip-vertical"
        :ui="{ base: 'p-1' }"
        aria-label="Перетащить"
      />

      <UButton
        v-if="hasChildren"
        color="neutral"
        variant="ghost"
        size="xs"
        icon="i-lucide-chevron-right"
        :ui="{
          base: 'p-0.5 transition-transform',
          leadingIcon: isCollapsed ? '' : 'rotate-90',
        }"
        :aria-label="isCollapsed ? 'Развернуть' : 'Свернуть'"
        @click="ctx.toggleCollapsed(node.id)"
      />
      <span v-else class="w-[22px]" />

      <Icon
        :name="node.icon || 'i-heroicons-minus-small'"
        class="text-lg shrink-0 text-neutral-500"
      />

      <span class="font-medium truncate">{{ node.title }}</span>

      <UBadge
        :label="node.isExternal ? 'Внешняя' : 'Внутренняя'"
        :color="node.isExternal ? 'secondary' : 'success'"
        variant="subtle"
        size="sm"
      />
      <UBadge
        v-if="node.target"
        :label="node.target === '_blank' ? 'Новая вкладка' : 'Эта вкладка'"
        color="neutral"
        variant="subtle"
        size="sm"
        class="hidden md:inline-flex"
      />

      <span
        class="ml-1 text-xs text-neutral-400 font-mono truncate hidden lg:inline"
      >
        {{ node.to || node.slug || '—' }}
      </span>

      <div
        class="ml-auto flex items-center gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity"
      >
        <UButton
          v-if="canHaveChildren"
          color="neutral"
          variant="ghost"
          size="xs"
          icon="i-heroicons-plus"
          label="Подпункт"
          @click="ctx.onCreateChild(node.id)"
        />
        <UButton
          color="secondary"
          variant="ghost"
          size="xs"
          icon="i-heroicons-pencil-square"
          label="Изменить"
          @click="ctx.onEdit(node)"
        />
      </div>
    </div>

    <ul
      v-show="!isCollapsed"
      ref="sublistEl"
      :data-parent-id="node.id"
      class="ml-6 pl-2 space-y-0.5 rounded-md transition-colors"
      :class="
        hasChildren
          ? 'border-l border-neutral-200 dark:border-neutral-700 py-1'
          : 'min-h-[10px]'
      "
    >
      <NavTreeNode
        v-for="child in node.children"
        :key="child.id"
        :node="child"
        :depth="depth + 1"
      />
    </ul>
  </li>
</template>
