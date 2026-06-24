<script setup lang="ts">
import dayjs from 'dayjs';
import { UBadge, UButton } from '#components';
import { usePostApi } from '~~/services/api/post.api';
import type { Post } from '~~/services/types/post.type';
import type { TableColumn, TableRow } from '#ui/components/Table.vue';

const postApi = usePostApi();
const searchText = ref('');
const toast = useToast();
const postsRes = ref();
const page = ref(1);

const columns: TableColumn<Post>[] = [
  {
    accessorKey: 'isDeleted',
    header: 'Статус',
    cell: ({ row }) =>
      h('div', { class: 'flex flex-col gap-1' }, [
        h(UBadge, {
          class: 'cursor-pointer w-max',
          color: row.original.isDeleted ? 'warning' : 'success',
          variant: 'subtle',
          label: row.original.isDeleted ? 'Скрыто' : 'Опубликовано',
          onClick: () => handleToggleVisibility(row.original),
        }),
        row.original.isPinned
          ? h(UBadge, { variant: 'subtle', color: 'info', label: 'Закреплён', class: 'w-max' })
          : null,
      ]),
  },
  {
    accessorKey: 'title',
    header: 'Название',
    cell: ({ row }) =>
      h('div', { class: 'space-y-0.5' }, [
        h('p', { class: 'font-medium' },
          row.original.title.length > 100
            ? row.original.title.slice(0, 100) + '…'
            : row.original.title
        ),
        row.original.department
          ? h('span', { class: 'text-xs text-neutral-400' }, row.original.department.title)
          : null,
      ]),
  },
  {
    accessorKey: 'createdAt',
    header: 'Дата создания',
    cell: ({ row }) =>
      h('div', { class: 'text-sm text-neutral-500 whitespace-nowrap' },
        dayjs(row.original.createdAt).format('DD.MM.YYYY HH:mm')
      ),
  },
  {
    id: 'actions',
    header: 'Действия',
    cell: ({ row }) =>
      h('div', { class: 'flex items-center gap-2' }, [
        h(UButton, {
          icon: 'i-heroicons-eye',
          variant: 'outline',
          color: 'neutral',
          size: 'xs',
          to: 'http://dev.infomania.ru/entry/' + row.original.slug,
          target: '_blank',
          title: 'Посмотреть на сайте',
        }),
        h(UButton, {
          icon: 'i-heroicons-pencil-square',
          variant: 'outline',
          color: 'secondary',
          size: 'xs',
          to: `/post/admin/${row.original.id}`,
          title: 'Редактировать',
        }),
      ]),
  },
];

const fetchPost = async () => {
  postsRes.value = await postApi.getAllPosts({
    limit: 30,
    isDeleted: true,
    sortBy: 'createdAt',
    search: searchText.value,
    page: page.value,
  });
};

await fetchPost();

const handleToggleVisibility = async (post: Post) => {
  post.isDeleted = !post.isDeleted;
  await postApi.updatePost(post.id, { isDeleted: post.isDeleted });
  toast.add({
    title: post.isDeleted ? 'Пост скрыт' : 'Пост восстановлен',
    color: post.isDeleted ? 'warning' : 'success',
  });
};

const onSelect = (_: Event, row: TableRow<Post>) => {
  navigateTo(`/post/admin/${row.original.id}`);
};

watch([page, searchText], () => fetchPost());

useHead({ title: 'НОМБ | Посты' });
</script>

<template>
  <NuxtLayout
    v-model="page"
    v-model:search="searchText"
    name="table"
    title="Управление постами"
    :meta="postsRes.meta"
    :event-create="() => navigateTo('/post/admin')"
  >
    <UTable
      :columns="columns"
      :data="postsRes.data"
      :ui="{ thead: 'bg-neutral-50 dark:bg-neutral-800/50' }"
      @select="onSelect"
    />
  </NuxtLayout>
</template>
