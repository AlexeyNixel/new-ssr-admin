<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui';
import { UBadge, UButton } from '#components';
import { useComicApi } from '~~/services/api/comic.api';
import dayjs from 'dayjs';
import type { Comic } from '~~/services/types/comic.type';
import AdminComic from '~/components/Modals/AdminComic.vue';

const toast = useToast();
const comicApi = useComicApi();
const comicRes = ref();
const page = ref(1);
const search = ref('');
const overlay = useOverlay();
const modal = overlay.create(AdminComic);

const fetchData = async () => {
  comicRes.value = await comicApi.getAllComics({
    isDeleted: true,
    limit: 20,
    page: page.value,
    search: search.value,
  });
};

await fetchData();

const columns: TableColumn<Comic>[] = [
  {
    id: 'preview',
    header: 'Обложка',
    cell: ({ row }) => {
      const cover = row.original.images[0]?.file.path;
      if (!cover)
        return h('div', {
          class: 'w-10 h-14 rounded bg-neutral-100 dark:bg-neutral-800',
        });
      return h('img', {
        src: `http://static.infomania.ru${cover}`,
        class: 'w-10 h-14 object-cover rounded',
        alt: row.original.title,
      });
    },
  },
  {
    accessorKey: 'title',
    header: 'Название',
    cell: ({ row }) =>
      h('div', { class: 'flex flex-col gap-1 max-w-xs text-wrap' }, [
        h('p', { class: 'font-medium' }, row.original.title),
        row.original.series
          ? h(
              UBadge,
              {
                variant: 'subtle',
                color: 'secondary',
                size: 'sm',
                class: 'w-max',
              },
              () =>
                row.original.series?.title +
                (row.original.volumeNumber
                  ? ` · том ${row.original.volumeNumber}`
                  : '')
            )
          : null,
      ]),
  },
  {
    id: 'author',
    header: 'Автор/художник',
    cell: ({ row }) =>
      h(
        'div',
        { class: 'text-sm text-neutral-600 text-wrap' },
        [
          row.original.author,
          row.original.illustrator &&
          row.original.illustrator !== row.original.author
            ? ` / ${row.original.illustrator}`
            : '',
        ]
          .filter(Boolean)
          .join('')
      ),
  },
  {
    id: 'status',
    header: 'Статус',
    cell: ({ row }) =>
      h(UBadge, {
        class: 'cursor-pointer w-max',
        variant: 'subtle',
        color: row.original.isDeleted ? 'warning' : 'success',
        label: row.original.isDeleted ? 'Скрыто' : 'Опубликовано',
        onClick: () => handleToggleVisibility(row.original),
      }),
  },
  {
    accessorKey: 'createdAt',
    header: 'Дата добавления',
    cell: ({ row }) =>
      h(
        'div',
        { class: 'text-sm text-neutral-500 whitespace-nowrap' },
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

const handleToggleVisibility = async (comic: Comic) => {
  comic.isDeleted = !comic.isDeleted;
  await comicApi.updateComic(comic.id, { isDeleted: comic.isDeleted });
  toast.add({
    title: comic.isDeleted ? 'Комикс скрыт' : 'Комикс восстановлен',
    color: comic.isDeleted ? 'warning' : 'success',
  });
};

const handleOpenModal = async (comic?: Comic) => {
  const instance = modal.open({ comic });
  const result = await instance.result;
  if (result) await fetchData();
};

useModalRouteOpener({
  modal,
  onClosed: () => fetchData(),
});

watch(page, () => fetchData());
watch(search, () => {
  page.value = 1;
  fetchData();
});

useHead({ title: 'НОМБ | Комиксы' });
</script>

<template>
  <NuxtLayout
    v-model="page"
    :meta="comicRes.meta"
    title="Управление комиксами"
    name="table"
    :search="search"
    :event-create="() => handleOpenModal()"
    @update:search="(value) => (search = value)"
  >
    <UTable
      :data="comicRes.data"
      :columns="columns"
      :ui="{ thead: 'bg-neutral-50 dark:bg-neutral-800/50' }"
    />
  </NuxtLayout>
</template>
