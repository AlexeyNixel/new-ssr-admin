<script setup lang="ts">
import type { TableColumn, TableRow } from '@nuxt/ui';
import { ListRowActions, ListThumb, ListVisibilityBadge, UBadge, UIcon } from '#components';
import { useBookApi } from '~~/services/api/book.api';
import type { Book } from '~~/services/types/book.type';

const PAGE_SIZE = 20;

const toast = useToast();
const bookApi = useBookApi();
const config = useRuntimeConfig();

// Старые ссылки ?editId=<id> ведут на страницу редактора
await redirectEditIdToPage('/book');

const { page, search, filters } = useListQuery({ status: 'all', type: 'all' });

/*
 * Поиск и фильтр по типу бэкенд для книг не поддерживает, а книг
 * немного (сотни) — загружаем все и фильтруем на клиенте.
 */
const allBooks = ref<Book[]>([]);
const loading = ref(false);

const fetchAll = async () => {
  loading.value = true;
  try {
    const result: Book[] = [];
    for (let p = 1; ; p++) {
      const res = await bookApi.getAllBook({ page: p, limit: 100, isDeleted: true, include: 'preview' });
      result.push(...(res.data ?? []));
      if (!res.meta?.hasNext || !res.data?.length) break;
    }
    allBooks.value = result;
  } catch {
    toast.add({ title: 'Не удалось загрузить книги', color: 'error' });
  } finally {
    loading.value = false;
  }
};

await fetchAll();

// Разбор записи нужен и для поиска по автору, и для ячейки — считаем один раз
const records = computed(() => new Map(allBooks.value.map((book) => [book.id, parseBookRecord(book.description)])));

const counts = computed(() => ({
  all: allBooks.value.length,
  published: allBooks.value.filter((book) => !book.isDeleted).length,
  hidden: allBooks.value.filter((book) => book.isDeleted).length,
  video: allBooks.value.filter((book) => book.isVideo).length,
}));

const filtered = computed(() => {
  const query = search.value.trim().toLowerCase();
  return allBooks.value.filter((book) => {
    if (filters.status === 'published' && book.isDeleted) return false;
    if (filters.status === 'hidden' && !book.isDeleted) return false;
    if (filters.type === 'book' && book.isVideo) return false;
    if (filters.type === 'video' && !book.isVideo) return false;
    if (!query) return true;
    // в записи — автор, издательство, ISBN
    return book.title.toLowerCase().includes(query) || (book.description ?? '').toLowerCase().includes(query);
  });
});

const rows = computed(() => filtered.value.slice((page.value - 1) * PAGE_SIZE, page.value * PAGE_SIZE));
const meta = computed(() => ({
  page: page.value,
  limit: PAGE_SIZE,
  total: filtered.value.length,
  hasPrev: page.value > 1,
  hasNext: page.value * PAGE_SIZE < filtered.value.length,
}));

// ---------- Действия ----------

const setVisibility = async (book: Book, isDeleted: boolean) => {
  const previous = book.isDeleted;
  book.isDeleted = isDeleted;
  try {
    await bookApi.updateBook(book.id, { isDeleted });
    toast.add({ title: isDeleted ? 'Книга скрыта' : 'Книга опубликована', color: 'success' });
  } catch {
    book.isDeleted = previous;
    toast.add({ title: 'Не удалось изменить видимость', color: 'error' });
  }
};

const rowActions = (book: Book) => [
  [
    { label: 'Редактировать', icon: 'i-lucide-pencil', to: `/book/admin/${book.id}` },
    ...(!book.isDeleted && book.slug
      ? [{ label: 'Открыть на сайте', icon: 'i-lucide-external-link', to: `${config.public.siteUrl}/books/${book.slug}`, target: '_blank' }]
      : []),
    ...(book.litresLink
      ? [{ label: 'ЛитРес', icon: 'i-lucide-tablet-smartphone', to: book.litresLink, target: '_blank' }]
      : []),
  ],
  [
    {
      label: book.isDeleted ? 'Опубликовать' : 'Скрыть с сайта',
      icon: book.isDeleted ? 'i-lucide-eye' : 'i-lucide-eye-off',
      onSelect: () => setVisibility(book, !book.isDeleted),
    },
  ],
];

// ---------- Таблица ----------

const columns: TableColumn<Book>[] = [
  {
    id: 'cover',
    header: '',
    meta: { class: { th: 'w-14', td: 'w-14' } },
    cell: ({ row }) =>
      h(ListThumb, { path: row.original.preview?.path, icon: 'i-lucide-book', aspect: '2 / 3', width: '2.5rem' }),
  },
  {
    id: 'title',
    header: 'Книга',
    cell: ({ row }) => {
      const book = row.original;
      const record = records.value.get(book.id);
      const imprint = [record?.publisher, record?.year].filter(Boolean).join(', ');
      return h('div', { class: 'min-w-60 max-w-md space-y-0.5 whitespace-normal' }, [
        h('p', { class: 'line-clamp-2 font-medium text-highlighted' }, book.title),
        record?.author || imprint
          ? h('p', { class: 'truncate text-xs text-muted' }, [record?.author, imprint].filter(Boolean).join(' · '))
          : null,
      ]);
    },
  },
  {
    id: 'type',
    header: 'Тип',
    cell: ({ row }) =>
      row.original.isVideo
        ? h(UBadge, { label: 'Видеообзор', icon: 'i-lucide-video', color: 'secondary', variant: 'subtle', class: 'w-max' })
        : h('span', { class: 'inline-flex items-center gap-1 text-sm text-muted' }, [
            h(UIcon, { name: 'i-lucide-book-open', class: 'size-3.5' }),
            'Книга',
          ]),
  },
  {
    id: 'place',
    header: 'Где взять',
    cell: ({ row }) =>
      h('p', { class: 'max-w-56 truncate text-sm text-default', title: row.original.place }, row.original.place || '—'),
  },
  {
    id: 'createdAt',
    header: 'Добавлена',
    cell: ({ row }) => h('span', { class: 'whitespace-nowrap text-sm text-muted' }, formatDate(row.original.createdAt)),
  },
  {
    id: 'status',
    header: 'На сайте',
    cell: ({ row }) =>
      h(ListVisibilityBadge, {
        hidden: row.original.isDeleted,
        hiddenLabel: 'Скрыта',
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

const onSelect = (_: Event, row: TableRow<Book>) => navigateTo(`/book/admin/${row.original.id}`);

const statusItems = computed(() => [
  { label: `Все · ${counts.value.all}`, value: 'all' },
  { label: `На сайте · ${counts.value.published}`, value: 'published' },
  { label: `Скрытые · ${counts.value.hidden}`, value: 'hidden' },
]);

const typeItems = [
  { label: 'Все типы', value: 'all' },
  { label: 'Книги', value: 'book' },
  { label: 'Видеообзоры', value: 'video' },
];

const resetFilters = () => {
  search.value = '';
  filters.status = 'all';
  filters.type = 'all';
};

useHead({ title: 'НОМБ | Книги' });
</script>

<template>
  <NuxtLayout
    v-model="page"
    v-model:search="search"
    name="table"
    title="Книги"
    :description="`${counts.all} ${plural(counts.all, ['книга', 'книги', 'книг'])} в каталоге, из них ${counts.video} с видеообзором, скрыто ${counts.hidden}`"
    create-label="Новая книга"
    search-placeholder="Название, автор, ISBN…"
    :meta="meta"
    :loading="loading"
    :event-create="() => navigateTo('/book/admin')"
  >
    <template #filters>
      <USelect v-model="filters.type" :items="typeItems" size="sm" class="w-40" />
      <UTabs v-model="filters.status" :items="statusItems" :content="false" size="sm" />
    </template>

    <UTable
      :columns="columns"
      :data="rows"
      :loading="loading"
      :ui="{ thead: 'bg-elevated/50', tr: 'cursor-pointer hover:bg-elevated/40', td: 'py-3' }"
      @select="onSelect"
    >
      <template #empty>
        <ListEmpty
          :searching="!!search || filters.status !== 'all' || filters.type !== 'all'"
          title="Книг пока нет"
          @reset="resetFilters"
        />
      </template>
    </UTable>
  </NuxtLayout>
</template>
