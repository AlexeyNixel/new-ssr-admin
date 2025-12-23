<template>
  <NuxtLayout
    v-model="page"
    name="table"
    title="Управление страницами"
    :meta="pageResult?.meta"
    :event-create="() => navigateTo('/page/admin')"
  >
    <UTable :columns="columns" :data="pageResult?.data" />
  </NuxtLayout>
</template>

<script setup lang="ts">
import { usePageApi } from '~~/services/api/page.api';
import type { TableColumn } from '#ui/components/Table.vue';
import type { Page } from '~~/services/types/page.type';
import { UBadge, UButton } from '#components';
import type { ApiResponse } from '~~/services/api';
import AdminPage from '~/components/Modals/AdminPage.vue';

const pageApi = usePageApi();
const page = ref(1);
const pageResult = ref<ApiResponse<Page[]>>();
const overlay = useOverlay();
const modal = overlay.create(AdminPage);

const columns: TableColumn<Page>[] = [
  {
    accessorKey: 'isDeleted',
    header: 'Статус',
    cell: ({ row }) => {
      return h(UBadge, {
        class: 'hover:cursor-pointer w-max',
        variant: 'subtle',
        color: row.original.isDeleted ? 'warning' : 'success',
        label: row.original.isDeleted ? 'Скрыта' : 'Опубликована',
        onClick: () => handleHideDepartment(row.original),
      });
    },
  },
  {
    accessorKey: 'title',
    header: 'Название',
  },
  {
    id: 'actions',
    accessorKey: 'Действия',
    cell: ({ row }) => {
      return h('div', { class: 'flex items-center gap-2' }, [
        h(UButton, {
          icon: 'i-heroicons-eye',
          variant: 'outline',
          color: 'neutral',
          size: 'xs',
          to: 'http://dev.infomania.ru/entry/' + row.original.slug,
          target: '_blank',
          label: 'Посмотреть на сайте',
        }),
        h(UButton, {
          icon: 'i-heroicons-pencil-square',
          variant: 'outline',
          color: 'secondary',
          size: 'xs',
          onClick: () => navigateTo('/page/admin/' + row.original.slug),
          label: 'Редактировать',
        }),
      ]);
    },
  },
];

const fetchData = async () => {
  pageResult.value = await pageApi.getAllPages({
    page: page.value,
    isDeleted: true,
  });
};

await fetchData();

watch(page, () => {
  fetchData();
});
</script>
