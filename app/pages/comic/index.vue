<script setup lang="ts">
import type { TableColumn, TableRow } from '@nuxt/ui';
import { ListRowActions, ListThumb, ListVisibilityBadge, UBadge } from '#components';
import { useComicApi } from '~~/services/api/comic.api';
import type { Comic } from '~~/services/types/comic.type';
import type { Meta } from '~~/services/api';

const PAGE_SIZE = 20;

const toast = useToast();
const comicApi = useComicApi();

await redirectEditIdToPage('/comic');

const { page, search } = useListQuery();

const comics = ref<Comic[]>([]);
const meta = ref<Meta>();
const loading = ref(false);

const fetchData = async () => {
  loading.value = true;
  try {
    const res = await comicApi.getAllComics({
      isDeleted: true,
      limit: PAGE_SIZE,
      page: page.value,
      search: search.value || undefined,
    });
    comics.value = res.data ?? [];
    meta.value = res.meta;
  } catch {
    toast.add({ title: 'Не удалось загрузить комиксы', color: 'error' });
  } finally {
    loading.value = false;
  }
};

await fetchData();
watch([page, search], fetchData);

// ---------- Действия ----------

const setVisibility = async (comic: Comic, isDeleted: boolean) => {
  const previous = comic.isDeleted;
  comic.isDeleted = isDeleted;
  try {
    await comicApi.updateComic(comic.id, { isDeleted });
    toast.add({ title: isDeleted ? 'Комикс скрыт' : 'Комикс опубликован', color: 'success' });
  } catch {
    comic.isDeleted = previous;
    toast.add({ title: 'Не удалось изменить видимость', color: 'error' });
  }
};

const rowActions = (comic: Comic) => [
  [
    { label: 'Редактировать', icon: 'i-lucide-pencil', to: `/comic/admin/${comic.id}` },
    ...(comic.externalLink
      ? [{ label: 'Где прочитать', icon: 'i-lucide-external-link', to: comic.externalLink, target: '_blank' }]
      : []),
  ],
  [
    {
      label: comic.isDeleted ? 'Опубликовать' : 'Скрыть с сайта',
      icon: comic.isDeleted ? 'i-lucide-eye' : 'i-lucide-eye-off',
      onSelect: () => setVisibility(comic, !comic.isDeleted),
    },
  ],
];

// ---------- Таблица ----------

const authors = (comic: Comic) =>
  [...new Set([comic.author, comic.illustrator].map((v) => v?.trim()).filter(Boolean))].join(', ');

const columns: TableColumn<Comic>[] = [
  {
    id: 'cover',
    header: '',
    meta: { class: { th: 'w-14', td: 'w-14' } },
    cell: ({ row }) =>
      h(ListThumb, {
        path: row.original.images?.[0]?.file?.path,
        aspect: '2 / 3',
        width: '2.5rem',
        icon: 'i-lucide-book-open',
      }),
  },
  {
    id: 'title',
    header: 'Комикс',
    cell: ({ row }) => {
      const comic = row.original;
      const genres = (comic.genres ?? []).map(({ genre }) => genre.title);
      const series = comic.series
        ? comic.series.title + (comic.volumeNumber != null ? ` · том ${comic.volumeNumber}` : '')
        : comic.volumeNumber != null
          ? `Том ${comic.volumeNumber}`
          : '';
      return h('div', { class: 'min-w-60 max-w-md space-y-1 whitespace-normal' }, [
        h('p', { class: 'line-clamp-2 font-medium text-highlighted' }, comic.title),
        h('div', { class: 'flex flex-wrap items-center gap-1 text-xs text-muted' }, [
          series ? h(UBadge, { label: series, color: 'secondary', variant: 'subtle', size: 'sm' }) : null,
          ...genres.slice(0, 2).map((title) => h(UBadge, { label: title, color: 'neutral', variant: 'outline', size: 'sm' })),
          genres.length > 2 ? h('span', `+${genres.length - 2}`) : null,
        ]),
      ]);
    },
  },
  {
    id: 'authors',
    header: 'Авторы',
    cell: ({ row }) =>
      h('p', { class: 'max-w-56 whitespace-normal text-sm text-default' }, authors(row.original) || '—'),
  },
  {
    id: 'edition',
    header: 'Издание',
    cell: ({ row }) =>
      h('div', { class: 'flex items-center gap-2 text-sm' }, [
        h('span', { class: 'tabular-nums text-default' }, row.original.year ? String(row.original.year) : '—'),
        row.original.ageRating != null
          ? h(UBadge, { label: `${row.original.ageRating}+`, color: 'neutral', variant: 'outline', size: 'sm' })
          : null,
      ]),
  },
  {
    id: 'status',
    header: 'На сайте',
    cell: ({ row }) =>
      h(ListVisibilityBadge, {
        hidden: row.original.isDeleted,
        hiddenLabel: 'Скрыт',
        toggle: () => setVisibility(row.original, !row.original.isDeleted),
      }),
  },
  {
    id: 'actions',
    header: '',
    meta: { class: { td: 'w-12' } },
    cell: ({ row }) => h(ListRowActions, { items: rowActions(row.original) }),
  },
];

const onSelect = (_: Event, row: TableRow<Comic>) => navigateTo(`/comic/admin/${row.original.id}`);

useHead({ title: 'НОМБ | Комиксы' });
</script>

<template>
  <NuxtLayout
    v-model="page"
    v-model:search="search"
    name="table"
    title="Комиксы"
    :description="meta ? `${meta.total} ${plural(meta.total, ['комикс', 'комикса', 'комиксов'])} в каталоге` : undefined"
    create-label="Новый комикс"
    search-placeholder="Поиск по названию…"
    :meta="meta"
    :loading="loading"
    :event-create="() => navigateTo('/comic/admin')"
  >
    <UTable
      :columns="columns"
      :data="comics"
      :loading="loading"
      :ui="{ thead: 'bg-elevated/50', tr: 'cursor-pointer hover:bg-elevated/40', td: 'py-3' }"
      @select="onSelect"
    >
      <template #empty>
        <ListEmpty :searching="!!search" title="Комиксов пока нет" @reset="search = ''" />
      </template>
    </UTable>
  </NuxtLayout>
</template>
