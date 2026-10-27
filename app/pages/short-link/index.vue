<script setup lang="ts">
import type { TableColumn, TableRow } from '@nuxt/ui';
import { ListRowActions, ListVisibilityBadge, UButton, UTooltip, ModalsAdminShortLink } from '#components';
import { useShortLinkApi } from '~~/services/api/short-link.api';
import type { IShortLink } from '~~/services/types/short-link.type';
import type { Meta } from '~~/services/api';

const PAGE_SIZE = 20;

const overlay = useOverlay();
const modal = overlay.create(ModalsAdminShortLink);
const toast = useToast();
const shortLinkApi = useShortLinkApi();
const linkUrl = useShortLinkUrl();
const { copy } = useClipboard({ legacy: true });

const { page, search, filters } = useListQuery({ status: 'all' });

const shortLinks = ref<IShortLink[]>([]);
const meta = ref<Meta>();
const loading = ref(false);
const counts = reactive({ all: 0, active: 0 });

const fetchData = async () => {
  loading.value = true;
  try {
    const res = await shortLinkApi.getAllShortLinks({
      limit: PAGE_SIZE,
      page: page.value,
      search: search.value || undefined,
      // наличие isDeleted = «включая скрытые»; без него — только активные
      ...(filters.status === 'all' ? { isDeleted: true } : {}),
    });
    shortLinks.value = res.data ?? [];
    meta.value = res.meta;
  } catch {
    toast.add({ title: 'Не удалось загрузить ссылки', color: 'error' });
  } finally {
    loading.value = false;
  }
};

const fetchCounts = async () => {
  const [all, active] = await Promise.allSettled([
    shortLinkApi.getAllShortLinks({ limit: 1, isDeleted: true }),
    shortLinkApi.getAllShortLinks({ limit: 1 }),
  ]);
  if (all.status === 'fulfilled') counts.all = all.value.meta?.total ?? 0;
  if (active.status === 'fulfilled') counts.active = active.value.meta?.total ?? 0;
};

const reload = () => Promise.all([fetchData(), fetchCounts()]);

await reload();
watch([page, search, () => ({ ...filters })], fetchData);

// ---------- Действия ----------

const copyLink = async (shortLink: IShortLink) => {
  await copy(linkUrl.full(shortLink.slug));
  toast.add({ title: 'Ссылка скопирована', description: linkUrl.display(shortLink.slug), color: 'success' });
};

const setVisibility = async (shortLink: IShortLink, isDeleted: boolean) => {
  const previous = shortLink.isDeleted;
  shortLink.isDeleted = isDeleted;
  try {
    await shortLinkApi.updateShortLink(shortLink.id, { isDeleted });
    counts.active += isDeleted ? -1 : 1;
    toast.add({ title: isDeleted ? 'Ссылка скрыта' : 'Ссылка снова работает', color: 'success' });
  } catch {
    shortLink.isDeleted = previous;
    toast.add({ title: 'Не удалось изменить статус', color: 'error' });
  }
};

const handleOpenModal = async (shortLink?: IShortLink) => {
  const instance = modal.open({ shortLink });
  const result = await instance.result;
  if (result) await reload();
};

useModalRouteOpener({
  modal,
  onClosed: () => reload(),
});

const rowActions = (shortLink: IShortLink) => [
  [
    { label: 'Редактировать', icon: 'i-lucide-pencil', onSelect: () => handleOpenModal(shortLink) },
    { label: 'Скопировать ссылку', icon: 'i-lucide-copy', onSelect: () => copyLink(shortLink) },
    { label: 'Открыть исходную ссылку', icon: 'i-lucide-external-link', to: shortLink.url, target: '_blank' },
  ],
  [
    {
      label: shortLink.isDeleted ? 'Включить' : 'Скрыть',
      icon: shortLink.isDeleted ? 'i-lucide-eye' : 'i-lucide-eye-off',
      onSelect: () => setVisibility(shortLink, !shortLink.isDeleted),
    },
  ],
];

// ---------- Таблица ----------

const columns: TableColumn<IShortLink>[] = [
  {
    id: 'link',
    header: 'Ссылка',
    cell: ({ row }) => {
      const link = row.original;
      return h('div', { class: 'min-w-60 max-w-md space-y-1 whitespace-normal' }, [
        h('p', { class: 'line-clamp-2 font-medium text-highlighted' }, link.title || linkUrl.display(link.slug)),
        h('div', { class: 'flex items-center gap-1' }, [
          h('span', { class: 'truncate font-mono text-sm text-primary' }, linkUrl.display(link.slug)),
          h(UTooltip, { text: 'Скопировать' }, () =>
            h(UButton, {
              icon: 'i-lucide-copy',
              color: 'neutral',
              variant: 'ghost',
              size: 'xs',
              'aria-label': 'Скопировать ссылку',
              onClick: (event: MouseEvent) => {
                event.stopPropagation();
                copyLink(link);
              },
            })
          ),
        ]),
      ]);
    },
  },
  {
    id: 'url',
    header: 'Куда ведёт',
    cell: ({ row }) =>
      h(UTooltip, { text: row.original.url, ui: { content: 'h-auto max-w-md', text: 'break-all whitespace-normal' } }, () =>
        h('p', { class: 'max-w-xs truncate text-sm text-muted' }, row.original.url.replace(/^https?:\/\//, ''))
      ),
  },
  {
    id: 'clicks',
    header: 'Переходы',
    cell: ({ row }) => h('span', { class: 'font-medium tabular-nums' }, row.original.clicks.toLocaleString('ru-RU')),
  },
  {
    id: 'createdAt',
    header: 'Создана',
    cell: ({ row }) => h('span', { class: 'whitespace-nowrap text-sm text-muted' }, formatDate(row.original.createdAt)),
  },
  {
    id: 'status',
    header: 'Статус',
    cell: ({ row }) =>
      h(ListVisibilityBadge, {
        hidden: row.original.isDeleted,
        shownLabel: 'Работает',
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

const onSelect = (_: Event, row: TableRow<IShortLink>) => handleOpenModal(row.original);

const statusItems = computed(() => [
  { label: `Все · ${counts.all}`, value: 'all' },
  { label: `Работают · ${counts.active}`, value: 'active' },
]);

const resetFilters = () => {
  search.value = '';
  filters.status = 'all';
};

useHead({ title: 'НОМБ | Короткие ссылки' });
</script>

<template>
  <NuxtLayout
    v-model="page"
    v-model:search="search"
    name="table"
    title="Короткие ссылки"
    :description="`${counts.all} ${plural(counts.all, ['ссылка', 'ссылки', 'ссылок'])}, скрыто ${Math.max(0, counts.all - counts.active)}. Скрытая ссылка ведёт на главную сайта`"
    create-label="Новая ссылка"
    search-placeholder="Поиск по названию, адресу…"
    :meta="meta"
    :loading="loading"
    :event-create="() => handleOpenModal()"
  >
    <template #filters>
      <UTabs v-model="filters.status" :items="statusItems" :content="false" size="sm" />
    </template>

    <UTable
      :columns="columns"
      :data="shortLinks"
      :loading="loading"
      :ui="{ thead: 'bg-elevated/50', tr: 'cursor-pointer hover:bg-elevated/40', td: 'py-3' }"
      @select="onSelect"
    >
      <template #empty>
        <ListEmpty
          :searching="!!search || filters.status !== 'all'"
          icon="i-lucide-link"
          title="Коротких ссылок пока нет"
          @reset="resetFilters"
        />
      </template>
    </UTable>
  </NuxtLayout>
</template>
