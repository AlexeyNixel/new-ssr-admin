<script setup lang="ts">
import type { TableColumn, TableRow } from '@nuxt/ui';
import { ListRowActions, ListVisibilityBadge, ModalsAdminLibraryExhibition, UBadge } from '#components';
import { useLibraryExhibitionApi } from '~~/services/api/library-exhibition.api';
import type { LibraryExhibition } from '~~/services/types/library-exhibition.type';
import type { Meta } from '~~/services/api';

const PAGE_SIZE = 20;

const overlay = useOverlay();
const modal = overlay.create(ModalsAdminLibraryExhibition);
const toast = useToast();
const libraryExhibitionApi = useLibraryExhibitionApi();

const { page, search, filters } = useListQuery({ status: 'all' });

const exhibitions = ref<LibraryExhibition[]>([]);
const meta = ref<Meta>();
const loading = ref(false);
const counts = reactive({ all: 0, hidden: 0 });

const fetchData = async () => {
  loading.value = true;
  try {
    const res = await libraryExhibitionApi.getAll({
      page: page.value,
      limit: PAGE_SIZE,
      search: search.value || undefined,
      ...(filters.status !== 'all' && { status: filters.status as 'visible' | 'hidden' }),
    });
    exhibitions.value = res.data ?? [];
    meta.value = res.meta;
  } catch {
    toast.add({ title: 'Не удалось загрузить выставки', color: 'error' });
  } finally {
    loading.value = false;
  }
};

const fetchCounts = async () => {
  const [all, hidden] = await Promise.allSettled([
    libraryExhibitionApi.getAll({ limit: 1 }),
    libraryExhibitionApi.getAll({ limit: 1, status: 'hidden' }),
  ]);
  if (all.status === 'fulfilled') counts.all = all.value.meta?.total ?? 0;
  if (hidden.status === 'fulfilled') counts.hidden = hidden.value.meta?.total ?? 0;
};

const reload = () => Promise.all([fetchData(), fetchCounts()]);

await reload();
watch([page, search, () => ({ ...filters })], fetchData);

// ---------- Действия ----------

const openModal = async (exhibition?: LibraryExhibition) => {
  const instance = modal.open({ exhibition });
  if (await instance.result) await reload();
};

useModalRouteOpener({ modal, onClosed: () => reload() });

const setHidden = async (exhibition: LibraryExhibition, isHidden: boolean) => {
  const previous = exhibition.isHidden;
  exhibition.isHidden = isHidden;
  try {
    await libraryExhibitionApi.update(exhibition.id, { isHidden });
    counts.hidden += isHidden ? 1 : -1;
    toast.add({ title: isHidden ? 'Выставка скрыта с сайта' : 'Выставка снова на сайте', color: 'success' });
  } catch {
    exhibition.isHidden = previous;
    toast.add({ title: 'Не удалось изменить статус', color: 'error' });
  }
};

const rowActions = (exhibition: LibraryExhibition) => [
  [{ label: 'Редактировать', icon: 'i-lucide-pencil', onSelect: () => openModal(exhibition) }],
  [
    {
      label: exhibition.isHidden ? 'Показать на сайте' : 'Скрыть с сайта',
      icon: exhibition.isHidden ? 'i-lucide-eye' : 'i-lucide-eye-off',
      onSelect: () => setHidden(exhibition, !exhibition.isHidden),
    },
  ],
];

// ---------- Период ----------

const MONTHS = ['янв', 'фев', 'мар', 'апр', 'мая', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];
const pad = (value: number) => String(value).padStart(2, '0');

/*
 * Даты выставки приходят ISO-строками в «наивной» UTC-нотации (день без
 * времени), поэтому берём день прямо из строки, без перевода поясов.
 */
const isoDay = (value: string | Date) =>
  (value instanceof Date ? value.toISOString() : String(value)).slice(0, 10);

const dayParts = (value: string | Date) => {
  const [year, month, day] = isoDay(value).split('-').map(Number);
  return { year: year || 0, month: month || 1, day: day || 1 };
};

const formatDay = (value: string | Date, withYear: boolean) => {
  const { year, month, day } = dayParts(value);
  const label = `${day} ${MONTHS[month - 1]}`;
  return withYear ? `${label} ${year}` : label;
};

/** «12 ноя — 30 ноя 2026»: общий год пишется один раз, одна дата — без диапазона */
const formatPeriod = (startsAt: string | Date, endsAt: string | Date) => {
  if (isoDay(startsAt) === isoDay(endsAt)) return formatDay(startsAt, true);
  const sameYear = dayParts(startsAt).year === dayParts(endsAt).year;
  return `${formatDay(startsAt, !sameYear)} — ${formatDay(endsAt, true)}`;
};

const todayKey = () => {
  const now = new Date();
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
};

/** Последний день показа уже прошёл — такую выставку приглушаем */
const isPast = (exhibition: LibraryExhibition) => isoDay(exhibition.endsAt) < todayKey();

/** Выставка идёт прямо сейчас */
const isOngoing = (exhibition: LibraryExhibition) => {
  const today = todayKey();
  return isoDay(exhibition.startsAt) <= today && today <= isoDay(exhibition.endsAt);
};

// ---------- Таблица ----------

const columns: TableColumn<LibraryExhibition>[] = [
  {
    id: 'period',
    header: 'Период',
    meta: { class: { th: 'w-56', td: 'w-56' } },
    cell: ({ row }) => {
      const exhibition = row.original;
      const past = isPast(exhibition);
      const ongoing = isOngoing(exhibition);
      return h('div', { class: ['space-y-1 whitespace-normal', past && 'opacity-60'] }, [
        h(
          'p',
          { class: 'font-medium text-highlighted tabular-nums' },
          formatPeriod(exhibition.startsAt, exhibition.endsAt)
        ),
        past
          ? h('p', { class: 'text-xs text-muted' }, 'Завершилась')
          : ongoing
            ? h(UBadge, { label: 'Идёт сейчас', color: 'primary', variant: 'subtle', size: 'sm' })
            : null,
      ]);
    },
  },
  {
    id: 'exhibition',
    header: 'Выставка',
    cell: ({ row }) => {
      const exhibition = row.original;
      const past = isPast(exhibition);
      return h('div', { class: 'min-w-64 max-w-2xl space-y-1 whitespace-normal' }, [
        h(
          'p',
          { class: ['line-clamp-2 font-medium', past ? 'text-muted' : 'text-highlighted'] },
          exhibition.title
        ),
        exhibition.description
          ? h('p', { class: 'line-clamp-2 text-sm text-muted' }, exhibition.description)
          : null,
      ]);
    },
  },
  {
    id: 'status',
    header: 'Статус',
    cell: ({ row }) =>
      h(ListVisibilityBadge, {
        hidden: row.original.isHidden,
        shownLabel: 'На сайте',
        hiddenLabel: 'Скрыта',
        toggle: () => setHidden(row.original, !row.original.isHidden),
      }),
  },
  {
    id: 'actions',
    header: '',
    meta: { class: { td: 'w-12' } },
    cell: ({ row }) => h(ListRowActions, { items: rowActions(row.original) }),
  },
];

const onSelect = (_: Event, row: TableRow<LibraryExhibition>) => openModal(row.original);

const statusItems = computed(() => [
  { label: `Все · ${counts.all}`, value: 'all' },
  { label: `На сайте · ${Math.max(0, counts.all - counts.hidden)}`, value: 'visible' },
  { label: `Скрытые · ${counts.hidden}`, value: 'hidden' },
]);

const resetFilters = () => {
  search.value = '';
  filters.status = 'all';
};

useHead({ title: 'НОМБ | Выставки в календаре' });
</script>

<template>
  <NuxtLayout
    v-model="page"
    v-model:search="search"
    name="table"
    title="Выставки в календаре"
    :description="`${counts.all} ${plural(counts.all, ['выставка', 'выставки', 'выставок'])}, скрыто ${counts.hidden}. Анонсы физических выставок в календаре на главной`"
    create-label="Новая выставка"
    search-placeholder="Поиск по названию…"
    :meta="meta"
    :loading="loading"
    :event-create="() => openModal()"
  >
    <template #filters>
      <UTabs v-model="filters.status" :items="statusItems" :content="false" size="sm" />
    </template>

    <UTable
      :columns="columns"
      :data="exhibitions"
      :loading="loading"
      :ui="{ thead: 'bg-elevated/50', tr: 'cursor-pointer hover:bg-elevated/40', td: 'py-3' }"
      @select="onSelect"
    >
      <template #empty>
        <ListEmpty
          :searching="!!search || filters.status !== 'all'"
          icon="i-lucide-calendar-range"
          title="Выставок пока нет"
          @reset="resetFilters"
        />
      </template>
    </UTable>
  </NuxtLayout>
</template>
