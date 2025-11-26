<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui';
import { Icon, UBadge, UButton } from '#components';
import { useBookApi } from '~~/services/api/book.api';
import dayjs from 'dayjs';
import type { Book } from '~~/services/types/book.type';
import AdminBook from '~/components/Modals/AdminBook.vue';

const toast = useToast();
const bookApi = useBookApi();
const bookRes = ref();
const page = ref(1);
const overlay = useOverlay();
const modal = overlay.create(AdminBook);

const fetchData = async () => {
  bookRes.value = await bookApi.getAllBook({
    isDeleted: true,
    limit: 20,
    include: 'preview',
  });
};

await fetchData();

const columns: TableColumn<Book>[] = [
  {
    accessorKey: 'isDeleted',
    header: 'Статус',
    cell: ({ row }) => {
      return h(UBadge, {
        class: 'hover:cursor-pointer',
        variant: 'subtle',
        color: row.original.isDeleted ? 'warning' : 'success',
        label: row.original.isDeleted ? 'Скрыта' : 'Опубликована',
        onClick: () => handleHideBook(row.original),
      });
    },
  },
  {
    accessorKey: 'title',
    header: 'Название',
    cell: ({ row }) => {
      return h(
        'div',
        { class: 'text-gray-900 font-medium' },
        row.original.title
      );
    },
  },
  {
    accessorKey: 'createdAt',
    header: 'Дата создания',
    cell: ({ row }) => {
      return h('div', dayjs(row.original.createdAt).format('DD.MM.YYYY HH:mm'));
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
          // to: 'http://dev.infomania.ru/entry/' + row.original.slug,
          target: '_blank',
          title: 'Посмотреть на сайте',
        }),
        h(UButton, {
          icon: 'i-heroicons-pencil-square',
          variant: 'outline',
          color: 'secondary',
          size: 'xs',
          onClick: () => handleOpenModal(row.original),
          // to: `/post/admin/${row.original.id}`,
          title: 'Редактировать',
        }),
      ]);
    },
  },
];

const handleHideBook = async (book: Book) => {
  book.isDeleted = !book.isDeleted;

  await bookApi.updateBook(book.id, {
    isDeleted: book.isDeleted,
  });

  toast.add({
    title: book.isDeleted ? 'Книга скрыта' : 'Книга восстановлена',
  });
};
const handleOpenModal = (book?: Book) => {
  modal.open({ book });
};
</script>

<template>
  <NuxtLayout
    v-model="page"
    :meta="bookRes.meta"
    title="Управление книгами"
    name="table"
    :event-create="handleOpenModal"
  >
    <UTable
      ref="table"
      class="flex-1 bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden"
      :data="bookRes.data"
      :columns="columns"
      :ui="{
        thead: 'bg-gray-50 border-b border-gray-200',
        th: 'py-3 px-4 font-semibold text-gray-900 text-sm text-left whitespace-nowrap',
        tbody: 'divide-y divide-gray-200 my-table-tbody',
        td: 'py-3 px-4 align-middle group-hover:bg-gray-50 transition-colors',
        tr: 'group hover:bg-gray-50 transition-colors',
      }"
    />
  </NuxtLayout>
</template>

<style scoped></style>
