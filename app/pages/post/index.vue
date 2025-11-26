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
    cell: ({ row }) => {
      return h(UBadge, {
        class: 'hover:cursor-pointer',
        color: row.original.isDeleted ? 'warning' : 'success',
        variant: 'subtle',
        label: row.original.isDeleted ? 'Скрыта' : 'Опубликована',
        onClick: () => handleHidePost(row.original),
      });
    },
  },
  {
    accessorKey: 'title',
    header: 'Название',
    cell: ({ row }) => {
      return h(
        'div',
        { class: 'font-medium text-gray-900 text-wrap' },
        row.original.title.length > 150
          ? row.original.title.substring(0, 150) + '...'
          : row.original.title
      );
    },
  },
  {
    accessorKey: 'createdAt',
    header: 'Дата создания',
    cell: ({ row }) => {
      return h(
        'div',
        { class: 'text-gray-500 text-sm' },
        dayjs(row.original.createdAt).format('DD.MM.YYYY HH:mm')
      );
    },
  },
  {
    id: 'actions',
    header: 'Действия',
    cell: ({ row }) => {
      return h('div', { class: 'flex items-center gap-2' }, [
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
      ]);
    },
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

const handleHidePost = async (post: Post) => {
  post.isDeleted = !post.isDeleted;

  await postApi.updatePost(post.id, { isDeleted: post.isDeleted });

  toast.add({
    title: post.isDeleted ? 'Пост скрыт' : 'Пост восстановлен',
    color: post.isDeleted ? 'warning' : 'success',
  });
};

const onSelect = (e: Event, row: TableRow<Post>) => {
  navigateTo(`/post/admin/${row.original.id}`);
};

watch([page, searchText], () => {
  fetchPost();
});

useHead({
  title: 'Управление постами',
});
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
      :ui="{
        thead: 'bg-gray-50',
        th: 'py-3 font-semibold text-gray-900',
        td: 'py-4',
        tr: 'hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0',
      }"
      @select="onSelect"
    />
  </NuxtLayout>
</template>
