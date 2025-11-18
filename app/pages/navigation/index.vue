<script setup lang="ts">
import type { TableColumn } from '#ui/components/Table.vue';
import type { NavigationItem } from '~~/services/types/navigation-item.type';
import { Icon, ModalsAdminNavigation, UButton } from '#components';

const data = await $fetch('http://localhost:3333/api/navigation-item', {});
const expanded = ref({ 0: true });
const overlay = useOverlay();
const modal = overlay.create(ModalsAdminNavigation);

const columns: TableColumn<NavigationItem>[] = [
  {
    accessorKey: 'title',
    header: '#',
    cell: ({ row }) => {
      return h(
        'div',
        {
          style: {
            paddingLeft: `${row.depth}rem`,
          },
          class: 'flex items-center gap-2 w-5',
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
          row.getValue('title') as string,
        ]
      );
    },
  },

  {
    accessorKey: 'isExternal',
    header: 'Тип ссылки',
    cell: ({ row }) =>
      h('div', row.original.isExternal ? 'Внешняя' : 'Внутренняя'),
  },
  {
    accessorKey: 'icon',
    header: 'Иконка',
    cell: ({ row }) =>
      h(Icon, {
        name: row.original.icon,
        class: 'text-4xl text-black',
      }),
  },
  {
    accessorKey: 'order',
    header: 'Позиция',
  },
  {
    id: 'update',
    cell: ({ row }) =>
      h(UButton, {
        label: 'Обновить',
        onClick: () => modal.open({ id: row.original.id }),
      }),
  },
];

console.log(data);
</script>

<template>
  <UTable
    v-model:expanded="expanded"
    :columns="columns"
    :get-sub-rows="(row) => row.children"
    :data="data"
    class="flex-1"
    :ui="{
      base: 'border-separate border-spacing-0',
      tbody: '[&>tr]:last:[&>td]:border-b-0',
      tr: 'group',
      td: 'empty:p-0 group-has-[td:not(:empty)]:border-b border-default p-1',
      th: 'p-1',
    }"
  />
</template>

<style scoped></style>
