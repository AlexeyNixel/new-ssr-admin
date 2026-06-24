<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui';
import { UBadge, UButton } from '#components';
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
    page: page.value,
    include: 'preview',
  });
};

await fetchData();

const columns: TableColumn<Book>[] = [
  {
    accessorKey: 'isDeleted',
    header: 'Статус',
    cell: ({ row }) =>
      h('div', { class: 'flex flex-col gap-1' }, [
        h(UBadge, {
          class: 'cursor-pointer w-max',
          variant: 'subtle',
          color: row.original.isDeleted ? 'warning' : 'success',
          label: row.original.isDeleted ? 'Скрыто' : 'Опубликовано',
          onClick: () => handleToggleVisibility(row.original),
        }),
        row.original.isVideo
          ? h(UBadge, { variant: 'subtle', color: 'secondary', label: 'Видео', class: 'w-max' })
          : null,
      ]),
  },
  {
    id: 'preview',
    header: 'Обложка',
    cell: ({ row }) => {
      if (!row.original.preview?.path)
        return h('div', { class: 'w-10 h-14 rounded bg-neutral-100 dark:bg-neutral-800' });
      return h('img', {
        src: `http://static.infomania.ru${row.original.preview.path}`,
        class: 'w-10 h-14 object-cover rounded',
        alt: row.original.title,
      });
    },
  },
  {
    accessorKey: 'title',
    header: 'Название',
    cell: ({ row }) =>
      h('p', { class: 'font-medium max-w-xs' }, row.original.title),
  },
  {
    accessorKey: 'createdAt',
    header: 'Дата добавления',
    cell: ({ row }) =>
      h('div', { class: 'text-sm text-neutral-500 whitespace-nowrap' },
        dayjs(row.original.createdAt).format('DD.MM.YYYY')
      ),
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
        onClick: () => handleOpenModal(row.original),
      }),
  },
];

const handleToggleVisibility = async (book: Book) => {
  book.isDeleted = !book.isDeleted;
  await bookApi.updateBook(book.id, { isDeleted: book.isDeleted });
  toast.add({
    title: book.isDeleted ? 'Книга скрыта' : 'Книга восстановлена',
    color: book.isDeleted ? 'warning' : 'success',
  });
};

const handleOpenModal = async (book?: Book) => {
  const instance = modal.open({ book });
  const result = await instance.result;
  if (result) await fetchData();
};

watch(page, () => fetchData());

useHead({ title: 'НОМБ | Книги' });
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
      :data="bookRes.data"
      :columns="columns"
      :ui="{ thead: 'bg-neutral-50 dark:bg-neutral-800/50' }"
    />
  </NuxtLayout>
</template>
