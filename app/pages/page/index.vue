<script setup lang="ts">
import type { TableColumn, TableRow } from '@nuxt/ui';
import { ListRowActions, ListVisibilityBadge, UBadge } from '#components';
import { usePageApi } from '~~/services/api/page.api';
import type { Page } from '~~/services/types/page.type';

const PAGE_SIZE = 20;

const pageApi = usePageApi();
const toast = useToast();
const { copy } = useClipboard();

const { page, search, filters } = useListQuery({ status: 'all', sort: 'title' });

/*
 * Страниц немного (~100), а поиск бэкенд для них не поддерживает —
 * загружаем все и фильтруем/сортируем на клиенте.
 */
const allPages = ref<Page[]>([]);
const loading = ref(false);

const fetchAll = async () => {
  loading.value = true;
  try {
    const result: Page[] = [];
    for (let p = 1; ; p++) {
      const res = await pageApi.getAllPages({ page: p, limit: 100, isDeleted: true });
      result.push(...(res.data ?? []));
      if (!res.meta?.hasNext || !res.data?.length) break;
    }
    allPages.value = result;
  } catch {
    toast.add({ title: 'Не удалось загрузить страницы', color: 'error' });
  } finally {
    loading.value = false;
  }
};

await fetchAll();

const hasText = (p: Page) => stripHtml(p.content).length > 0;

const counts = computed(() => ({
  all: allPages.value.length,
  published: allPages.value.filter((p) => !p.isDeleted).length,
  hidden: allPages.value.filter((p) => p.isDeleted).length,
}));

const filtered = computed(() => {
  const query = search.value.trim().toLowerCase();
  const list = allPages.value.filter((p) => {
    if (filters.status === 'published' && p.isDeleted) return false;
    if (filters.status === 'hidden' && !p.isDeleted) return false;
    if (!query) return true;
    return p.title.toLowerCase().includes(query) || (p.slug ?? '').toLowerCase().includes(query);
  });
  if (filters.sort === 'title') {
    // без начальных кавычек/символов: «Университетская…» сортируется на «У»
    const key = (p: Page) => p.title.replace(/^[^\p{L}\p{N}]+/u, '');
    return [...list].sort((a, b) => key(a).localeCompare(key(b), 'ru'));
  }
  return list;
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

const setVisibility = async (p: Page, isDeleted: boolean) => {
  const previous = p.isDeleted;
  p.isDeleted = isDeleted;
  try {
    await pageApi.update(p.id, { isDeleted });
    toast.add({ title: isDeleted ? 'Страница скрыта' : 'Страница опубликована', color: 'success' });
  } catch {
    p.isDeleted = previous;
    toast.add({ title: 'Не удалось изменить видимость', color: 'error' });
  }
};

const editUrl = (p: Page) => `/page/admin/${p.slug}`;

const rowActions = (p: Page) => [
  [
    { label: 'Редактировать', icon: 'i-lucide-pencil', to: editUrl(p) },
    {
      label: 'Скопировать адрес',
      icon: 'i-lucide-link',
      onSelect: () => {
        copy(`/${p.slug}`);
        toast.add({ title: 'Адрес скопирован', icon: 'i-lucide-check' });
      },
    },
  ],
  [
    {
      label: p.isDeleted ? 'Опубликовать' : 'Скрыть с сайта',
      icon: p.isDeleted ? 'i-lucide-eye' : 'i-lucide-eye-off',
      onSelect: () => setVisibility(p, !p.isDeleted),
    },
  ],
];

// ---------- Таблица ----------

const contentBadge = (p: Page) => {
  const blocks = p.blocks?.length ?? 0;
  if (blocks) {
    return h(UBadge, {
      label: `${blocks} ${plural(blocks, ['блок', 'блока', 'блоков'])}`,
      icon: 'i-lucide-layout-grid',
      color: 'primary',
      variant: 'subtle',
    });
  }
  if (hasText(p)) {
    return h(UBadge, { label: 'Текст', icon: 'i-lucide-file-text', color: 'neutral', variant: 'subtle' });
  }
  return h(UBadge, { label: 'Пустая', icon: 'i-lucide-circle-dashed', color: 'warning', variant: 'subtle' });
};

const columns: TableColumn<Page>[] = [
  {
    id: 'title',
    header: 'Страница',
    cell: ({ row }) =>
      h('div', { class: 'min-w-64 max-w-2xl space-y-0.5 whitespace-normal' }, [
        h('p', { class: 'font-medium text-highlighted' }, row.original.title),
        h('p', { class: 'font-mono text-xs text-muted' }, row.original.slug ? `/${row.original.slug}` : 'адрес не задан'),
      ]),
  },
  {
    id: 'content',
    header: 'Содержимое',
    cell: ({ row }) => contentBadge(row.original),
  },
  {
    id: 'status',
    header: 'Статус',
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

const onSelect = (_: Event, row: TableRow<Page>) => navigateTo(editUrl(row.original));

const statusItems = computed(() => [
  { label: `Все · ${counts.value.all}`, value: 'all' },
  { label: `На сайте · ${counts.value.published}`, value: 'published' },
  { label: `Скрытые · ${counts.value.hidden}`, value: 'hidden' },
]);
const sortItems = [
  { label: 'По названию', value: 'title', icon: 'i-lucide-arrow-down-a-z' },
  { label: 'Как на сервере', value: 'server', icon: 'i-lucide-list' },
];

const resetFilters = () => {
  search.value = '';
  filters.status = 'all';
};

useHead({ title: 'НОМБ | Страницы' });
</script>

<template>
  <NuxtLayout
    v-model="page"
    v-model:search="search"
    name="table"
    title="Страницы"
    :description="`${counts.all} ${plural(counts.all, ['страница', 'страницы', 'страниц'])} сайта, скрыто ${counts.hidden}`"
    create-label="Новая страница"
    search-placeholder="Поиск по названию или адресу…"
    :meta="meta"
    :loading="loading"
    :event-create="() => navigateTo('/page/admin')"
  >
    <template #filters>
      <UTabs v-model="filters.status" :items="statusItems" :content="false" size="sm" />
      <USelect v-model="filters.sort" :items="sortItems" size="sm" class="w-44" />
    </template>

    <UTable
      :columns="columns"
      :data="rows"
      :loading="loading"
      :ui="{ thead: 'bg-elevated/50', tr: 'cursor-pointer hover:bg-elevated/40', td: 'py-3' }"
      @select="onSelect"
    >
      <template #empty>
        <ListEmpty :searching="!!search || filters.status !== 'all'" title="Страниц пока нет" @reset="resetFilters" />
      </template>
    </UTable>
  </NuxtLayout>
</template>
