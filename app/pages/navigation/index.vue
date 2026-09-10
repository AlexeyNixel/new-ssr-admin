<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui';
import { Icon, UBadge, UButton } from '#components';
import type { NavigationItem } from '~~/services/types/navigation-item.type';
import { useNavigationApi } from '~~/services/api/navigation.api';
import AdminNavigation from '~/components/Modals/AdminNavigation.vue';
import { useSortable } from '@vueuse/integrations/useSortable';

const navigationApi = useNavigationApi();
const overlay = useOverlay();
const modal = overlay.create(AdminNavigation);

const navigationsItems = ref<NavigationItem[]>(
  await navigationApi.getAllNavigation({ withoutDate: true })
);

const reloadNavigation = async () => {
  navigationsItems.value = await navigationApi.getAllNavigation();
};

const openModal = async (navigationItem?: NavigationItem) => {
  const instance = modal.open(navigationItem ? { navigationItem } : {});
  const result = await instance.result;
  if (result) await reloadNavigation();
};

const columns: TableColumn<NavigationItem>[] = [
  {
    accessorKey: 'title',
    header: 'Название',
    cell: ({ row }) =>
      h('div', {
        style: { paddingLeft: `${row.depth}rem` },
        class: 'flex items-center gap-2 font-medium',
      }, [
        h(UButton, {
          color: 'neutral',
          variant: 'outline',
          size: 'xs',
          icon: row.getIsExpanded() ? 'i-lucide-minus' : 'i-lucide-plus',
          class: !row.getCanExpand() && 'invisible',
          ui: { base: 'p-0 rounded-sm', leadingIcon: 'size-4' },
          onClick: row.getToggleExpandedHandler(),
        }),
        h(Icon, { name: row.original.icon, class: 'text-xl text-neutral-500' }),
        row.getValue('title') as string,
      ]),
  },
  {
    accessorKey: 'isExternal',
    header: 'Тип ссылки',
    cell: ({ row }) =>
      h(UBadge, {
        label: row.original.isExternal ? 'Внешняя' : 'Внутренняя',
        color: row.original.isExternal ? 'secondary' : 'success',
        variant: 'subtle',
      }),
  },
  {
    accessorKey: 'order',
    header: 'Позиция',
    cell: ({ row }) =>
      h('div', {
        class: 'text-sm font-mono text-neutral-500',
      }, row.original.order),
  },
  {
    id: 'actions',
    header: 'Действия',
    cell: ({ row }) =>
      h(UButton, {
        icon: 'i-heroicons-pencil-square',
        variant: 'outline',
        color: 'secondary',
        size: 'xs',
        label: 'Редактировать',
        onClick: () => openModal(row.original),
      }),
  },
];

const handleDragItem = async () => {
  try {
    const updates = navigationsItems.value.map((item, index) => ({
      id: item.id,
      order: index + 1,
    }));
    await navigationApi.updateBatchOrder(updates);
    navigationsItems.value = await navigationApi.getAllNavigation();
  } catch (error) {
    console.error('Ошибка при обновлении порядка:', error);
  }
};

const handleOpenModal = () => openModal();

useModalRouteOpener({
  modal,
  onClosed: () => reloadNavigation(),
});

useSortable('.my-table-tbody', navigationsItems, { animation: 150 });

useHead({ title: 'НОМБ | Навигация' });
</script>

<template>
  <NuxtLayout
    name="table"
    title="Управление навигацией"
    :event-create="handleOpenModal"
  >
    <UTable
      ref="table"
      :data="navigationsItems"
      :get-sub-rows="(row) => row.children"
      :columns="columns"
      :ui="{
        thead: 'bg-neutral-50 dark:bg-neutral-800/50',
        tbody: 'my-table-tbody',
      }"
      @dragend="handleDragItem"
    />
  </NuxtLayout>
</template>
