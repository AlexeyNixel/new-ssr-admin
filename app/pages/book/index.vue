<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui';
import { useSortable } from '@vueuse/integrations/useSortable.mjs';
import { Icon, UBadge, UButton } from '#components';
import type { NavigationItem } from '~~/services/types/navigation-item.type';
import { useNavigationApi } from '~~/services/api/navigation.api';

const navigationApi = useNavigationApi();
const navigationsItems = ref<NavigationItem[]>(
  await navigationApi.getAllNavigation()
);

const columns: TableColumn<NavigationItem>[] = [
  {
    accessorKey: 'title',
    header: 'Название',
    cell: ({ row }) => {
      return h(
        'div',
        {
          style: {
            paddingLeft: `${row.depth}rem`,
          },
          class: 'flex items-center gap-2',
        },
        [
          h(UButton, {
            color: 'neutral',
            variant: 'outline',
            size: 'xs',
            icon: row.getIsExpanded() ? 'i-lucide-minus' : 'i-lucide-plus',
            class: !row.getCanExpand() && 'invisible',
            ui: {
              base: 'p-0 rounded-sm',
              leadingIcon: 'size-4',
            },
            onClick: row.getToggleExpandedHandler(),
          }),
          h(Icon, { name: row.original.icon, class: 'text-2xl' }),
          row.getValue('title') as string,
        ]
      );
    },
  },
  {
    accessorKey: 'isExternal',
    header: 'Тип ссылки',
    cell: ({ row }) =>
      h(UBadge, {
        label: row.original.isExternal ? 'Внешняя' : 'Внутренняя',
        color: row.original.isExternal ? 'secondary' : 'success',
        variant: 'subtle',
        class: 'text-xs font-medium',
      }),
  },
  {
    accessorKey: 'order',
    header: 'Позиция',
    cell: ({ row }) =>
      h(
        'div',
        {
          class: `text-center text-sm font-mono text-gray-600 bg-gray-100 rounded px-2 py-1 ${
            row.depth > 0
              ? 'bg-blue-100 text-blue-700 border border-blue-200'
              : ''
          }`,
        },
        row.original.order
      ),
  },
];
const handleDragItem = async () => {
  try {
    const updates: Array<{ id: string; order: number }> =
      navigationsItems.value.map((item, index) => ({
        id: item.id,
        order: index + 1,
      }));

    await navigationApi.updateBatchOrder(updates);

    navigationsItems.value = await navigationApi.getAllNavigation();
  } catch (error) {
    console.error('Ошибка при обновлении порядка:', error);
  }
};
useSortable('.my-table-tbody', navigationsItems, {
  animation: 150,
});
</script>

<template>
  <div v-if="navigationsItems" class="h-full bg-gray-50 p-4">
    <UTable
      ref="table"
      class="flex-1 bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden"
      :data="navigationsItems"
      :get-sub-rows="(row) => row.children"
      :columns="columns"
      :ui="{
        thead: 'bg-gray-50 border-b border-gray-200',
        th: 'py-3 px-4 font-semibold text-gray-900 text-sm text-left whitespace-nowrap',
        tbody: 'divide-y divide-gray-200 my-table-tbody',
        td: 'py-3 px-4 align-middle group-hover:bg-gray-50 transition-colors',
        tr: 'group hover:bg-gray-50 transition-colors',
      }"
      @dragend="handleDragItem"
    />
  </div>
</template>

<style scoped>
/* Стили для drag and drop */
.sortable-ghost {
  opacity: 0.4;
  background-color: #dbeafe !important;
}

.sortable-chosen {
  background-color: #eff6ff !important;
  transform: rotate(2deg);
}

.sortable-drag {
  background-color: #ffffff !important;
  box-shadow:
    0 10px 25px -5px rgba(0, 0, 0, 0.1),
    0 10px 10px -5px rgba(0, 0, 0, 0.04);
  z-index: 9999;
}

/* Стили для иконки перетаскивания */
:deep(.drag-handle) {
  cursor: grab;
}

:deep(.drag-handle:active) {
  cursor: grabbing;
}

/* Плавные анимации для интерактивных элементов */
:deep(.u-table tr) {
  transition: all 0.3s ease-in-out;
}

:deep(.u-button) {
  transition: all 0.2s ease-in-out;
}
</style>
