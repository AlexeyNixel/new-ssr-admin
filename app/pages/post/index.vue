<script setup lang="ts">
import type { TableColumn, TableRow } from '@nuxt/ui';
import { ListRowActions, ListThumb, ListVisibilityBadge, UBadge, UIcon } from '#components';
import { usePostApi } from '~~/services/api/post.api';
import { useDepartmentApi } from '~~/services/api/department.api';
import type { Post } from '~~/services/types/post.type';
import type { Meta } from '~~/services/api';

const SITE_URL = 'http://dev.infomania.ru/entry/';
const PAGE_SIZE = 20;

const postApi = usePostApi();
const departmentApi = useDepartmentApi();
const toast = useToast();
const { copy } = useClipboard();

const { page, search, filters } = useListQuery({ status: 'all', sort: 'new' });

const posts = ref<Post[]>([]);
const meta = ref<Meta>();
const loading = ref(false);

// Бэкенд отдаёт только одно отношение (include=preview), отдел берём из справочника
const departmentTitles = ref<Record<string, string>>({});
const counts = reactive({ all: 0, published: 0 });

const fetchPosts = async () => {
  loading.value = true;
  try {
    const res = await postApi.getAllPosts({
      limit: PAGE_SIZE,
      page: page.value,
      search: search.value || undefined,
      sortBy: 'createdAt',
      sortOrder: filters.sort === 'old' ? 'asc' : 'desc',
      include: 'preview',
      // наличие isDeleted = «включая скрытые»; без него — только опубликованные
      ...(filters.status === 'all' ? { isDeleted: true } : {}),
    });
    posts.value = res.data ?? [];
    meta.value = res.meta;
  } catch {
    toast.add({ title: 'Не удалось загрузить новости', color: 'error' });
  } finally {
    loading.value = false;
  }
};

const fetchCounts = async () => {
  const [all, published] = await Promise.allSettled([
    postApi.getAllPosts({ limit: 1, isDeleted: true }),
    postApi.getAllPosts({ limit: 1 }),
  ]);
  if (all.status === 'fulfilled') counts.all = all.value.meta?.total ?? 0;
  if (published.status === 'fulfilled') counts.published = published.value.meta?.total ?? 0;
};

await Promise.all([
  fetchPosts(),
  fetchCounts(),
  departmentApi
    .getAllDepartments({ limit: 100 })
    .then((res) => {
      departmentTitles.value = Object.fromEntries((res.data ?? []).map((d) => [d.id, d.title]));
    })
    .catch(() => {}),
]);

watch([page, search, () => ({ ...filters })], fetchPosts);

// ---------- Действия ----------

const setVisibility = async (post: Post, isDeleted: boolean) => {
  const previous = post.isDeleted;
  post.isDeleted = isDeleted;
  try {
    await postApi.updatePost(post.id, { isDeleted });
    counts.published += isDeleted ? -1 : 1;
    toast.add({ title: isDeleted ? 'Новость скрыта' : 'Новость опубликована', color: 'success' });
  } catch {
    post.isDeleted = previous;
    toast.add({ title: 'Не удалось изменить видимость', color: 'error' });
  }
};

const setPinned = async (post: Post, isPinned: boolean) => {
  const previous = post.isPinned;
  post.isPinned = isPinned;
  try {
    await postApi.updatePost(post.id, { isPinned });
    toast.add({ title: isPinned ? 'Новость закреплена' : 'Новость откреплена', color: 'success' });
  } catch {
    post.isPinned = previous;
    toast.add({ title: 'Не удалось изменить закрепление', color: 'error' });
  }
};

const rowActions = (post: Post) => [
  [
    { label: 'Редактировать', icon: 'i-lucide-pencil', to: `/post/admin/${post.id}` },
    { label: 'Открыть на сайте', icon: 'i-lucide-external-link', to: SITE_URL + post.slug, target: '_blank' },
    {
      label: 'Скопировать ссылку',
      icon: 'i-lucide-link',
      onSelect: () => {
        copy(SITE_URL + post.slug);
        toast.add({ title: 'Ссылка скопирована', icon: 'i-lucide-check' });
      },
    },
  ],
  [
    {
      label: post.isPinned ? 'Открепить' : 'Закрепить',
      icon: post.isPinned ? 'i-lucide-pin-off' : 'i-lucide-pin',
      onSelect: () => setPinned(post, !post.isPinned),
    },
    {
      label: post.isDeleted ? 'Опубликовать' : 'Скрыть с сайта',
      icon: post.isDeleted ? 'i-lucide-eye' : 'i-lucide-eye-off',
      onSelect: () => setVisibility(post, !post.isDeleted),
    },
  ],
];

// ---------- Таблица ----------

const isFuture = (value?: string) => !!value && new Date(value).getTime() > Date.now();

const columns: TableColumn<Post>[] = [
  {
    id: 'cover',
    header: '',
    meta: { class: { th: 'w-20', td: 'w-20' } },
    cell: ({ row }) =>
      h(ListThumb, { path: row.original.preview?.path, aspect: '16 / 10', width: '4.5rem', icon: 'i-lucide-newspaper' }),
  },
  {
    id: 'title',
    header: 'Новость',
    cell: ({ row }) => {
      const post = row.original;
      const department = departmentTitles.value[post.departmentId];
      return h('div', { class: 'min-w-64 max-w-xl space-y-1 whitespace-normal' }, [
        h('p', { class: 'line-clamp-2 font-medium text-highlighted' }, post.title),
        post.description ? h('p', { class: 'line-clamp-1 text-xs text-muted' }, post.description) : null,
        h('div', { class: 'flex flex-wrap items-center gap-1.5 text-xs text-dimmed' }, [
          post.isPinned
            ? h(UBadge, { label: 'Закреплена', icon: 'i-lucide-pin', color: 'info', variant: 'subtle', size: 'sm' })
            : null,
          department ? h('span', { class: 'truncate' }, department) : null,
        ]),
      ]);
    },
  },
  {
    id: 'publishedAt',
    header: 'Дата публикации',
    cell: ({ row }) => {
      const date = row.original.publishedAt || row.original.createdAt;
      return h('div', { class: 'whitespace-nowrap text-sm' }, [
        h('p', { class: 'text-default' }, formatDate(date)),
        isFuture(date)
          ? h('p', { class: 'flex items-center gap-1 text-xs text-info' }, [
              h(UIcon, { name: 'i-lucide-clock', class: 'size-3' }),
              `Запланирована, ${formatRelative(date)}`,
            ])
          : h('p', { class: 'text-xs text-dimmed' }, formatRelative(date)),
      ]);
    },
  },
  {
    id: 'status',
    header: 'Статус',
    cell: ({ row }) =>
      h(ListVisibilityBadge, {
        hidden: row.original.isDeleted,
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

const onSelect = (_: Event, row: TableRow<Post>) => navigateTo(`/post/admin/${row.original.id}`);

const statusItems = computed(() => [
  { label: `Все · ${counts.all.toLocaleString('ru-RU')}`, value: 'all' },
  { label: `На сайте · ${counts.published.toLocaleString('ru-RU')}`, value: 'published' },
]);
const sortItems = [
  { label: 'Сначала новые', value: 'new', icon: 'i-lucide-arrow-down-wide-narrow' },
  { label: 'Сначала старые', value: 'old', icon: 'i-lucide-arrow-up-narrow-wide' },
];

const hiddenCount = computed(() => Math.max(0, counts.all - counts.published));
const description = computed(() =>
  counts.all
    ? `${counts.all.toLocaleString('ru-RU')} ${plural(counts.all, ['новость', 'новости', 'новостей'])}, скрыто ${hiddenCount.value.toLocaleString('ru-RU')}`
    : undefined
);

const resetFilters = () => {
  search.value = '';
  filters.status = 'all';
  filters.sort = 'new';
};

useHead({ title: 'НОМБ | Новости' });
</script>

<template>
  <NuxtLayout
    v-model="page"
    v-model:search="search"
    name="table"
    title="Новости"
    :description="description"
    create-label="Новая новость"
    search-placeholder="Поиск по заголовку и тексту…"
    :meta="meta"
    :loading="loading"
    :event-create="() => navigateTo('/post/admin')"
  >
    <template #filters>
      <UTabs v-model="filters.status" :items="statusItems" :content="false" size="sm" />
      <USelect v-model="filters.sort" :items="sortItems" size="sm" class="w-44" />
    </template>

    <UTable
      :columns="columns"
      :data="posts"
      :loading="loading"
      :ui="{ thead: 'bg-elevated/50', tr: 'cursor-pointer hover:bg-elevated/40', td: 'py-3' }"
      @select="onSelect"
    >
      <template #empty>
        <ListEmpty :searching="!!search || filters.status !== 'all'" title="Новостей пока нет" @reset="resetFilters" />
      </template>
    </UTable>
  </NuxtLayout>
</template>
