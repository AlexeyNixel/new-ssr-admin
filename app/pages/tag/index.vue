<script setup lang="ts">
import dayjs from 'dayjs';
import type { TableColumn } from '#ui/components/Table.vue';
import { useTagApi } from '~~/services/api/tag.api';
import type { Tag } from '~~/services/types/tag.type';

const tagApi = useTagApi();
const tagRes = ref();
const page = ref(1);

const columns: TableColumn<Tag>[] = [
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
    accessorKey: 'createdAt',
    header: 'Дата создания',
    cell: ({ row }) =>
      h('div', { class: 'text-sm text-neutral-500' }, dayjs(row.original.createdAt).format('DD.MM.YYYY')),
  },
];

const fetchData = async () => {
  tagRes.value = await tagApi.getAllTags({ page: page.value, limit: 30 });
};

await fetchData();

watch(page, () => fetchData());

useHead({ title: 'НОМБ | Теги' });
</script>

<template>
  <NuxtLayout
    v-model="page"
    name="table"
    title="Управление тегами"
    :meta="tagRes.meta"
  >
    <UTable
      :columns="columns"
      :data="tagRes.data"
      :ui="{ thead: 'bg-neutral-50 dark:bg-neutral-800/50' }"
    />
  </NuxtLayout>
</template>
