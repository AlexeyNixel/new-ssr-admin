<script setup lang="ts">
import { usePageApi } from '~~/services/api/page.api';
import type { TableColumn } from '#ui/components/Table.vue';
import type { Page } from '~~/services/types/page.type';
import { UBadge, UButton } from '#components';

const pageApi = usePageApi();
const toast = useToast();
const page = ref(1);
const pageResult = ref();

const columns: TableColumn<Page>[] = [
  {
    accessorKey: 'isDeleted',
    header: 'Статус',
    cell: ({ row }) =>
      h(UBadge, {
        class: 'cursor-pointer',
        variant: 'subtle',
        color: row.original.isDeleted ? 'warning' : 'success',
        label: row.original.isDeleted ? 'Скрыто' : 'Опубликовано',
        onClick: () => handleToggleVisibility(row.original),
      }),
  },
  {
    accessorKey: 'title',
    header: 'Название',
    cell: ({ row }) =>
      h('p', { class: 'font-medium' }, row.original.title),
  },
  {
    accessorKey: 'slug',
    header: 'Slug',
    cell: ({ row }) =>
      h('code', { class: 'text-xs bg-neutral-100 dark:bg-neutral-800 px-1.5 py-0.5 rounded' }, row.original.slug || '—'),
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
        onClick: () => navigateTo('/page/admin/' + row.original.slug),
      }),
  },
];

const handleToggleVisibility = async (p: Page) => {
  p.isDeleted = !p.isDeleted;
  await pageApi.update(p.id, { isDeleted: p.isDeleted });
  toast.add({
    title: p.isDeleted ? 'Страница скрыта' : 'Страница опубликована',
    color: p.isDeleted ? 'warning' : 'success',
  });
};

const fetchData = async () => {
  pageResult.value = await pageApi.getAllPages({
    page: page.value,
    isDeleted: true,
  });
};

await fetchData();

watch(page, () => fetchData());

useHead({ title: 'НОМБ | Страницы' });
</script>

<template>
  <NuxtLayout
    v-model="page"
    name="table"
    title="Управление страницами"
    :meta="pageResult.meta"
    :event-create="() => navigateTo('/page/admin')"
  >
    <UTable
      :columns="columns"
      :data="pageResult.data"
      :ui="{ thead: 'bg-neutral-50 dark:bg-neutral-800/50' }"
    />
  </NuxtLayout>
</template>
