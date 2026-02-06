<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui';
import { Icon, UBadge, UButton } from '#components';
import type { NavigationItem } from '~~/services/types/navigation-item.type';
import { useNavigationApi } from '~~/services/api/navigation.api';
import AdminNavigation from '~/components/Modals/AdminNavigation.vue';
import { useSortable } from '@vueuse/integrations';

const navigationApi = useNavigationApi();
const overlay = useOverlay();
const modal = overlay.create(AdminNavigation);

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
          class: 'flex items-center gap-2 font-medium',
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
  {
    id: 'actions',
    cell: ({ row }) =>
      h(UButton, {
        onClick: () => modal.open({ navigationItem: row.original }),
        icon: 'i-heroicons-pencil-square',
        color: 'secondary',
        variant: 'outline',
      }),
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

const handleOpenModal = async () => {
  const instance = modal.open({});

  const result = await instance.result;
};

useSortable('.my-table-tbody', navigationsItems, {
  animation: 150,
});
</script>

<template>
  <NuxtLayout
    name="table"
    title="Управление навигацией"
    :event-create="handleOpenModal"
  >
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
  </NuxtLayout>
</template>
