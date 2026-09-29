<script setup lang="ts">
import type { TableColumn, TableRow } from '@nuxt/ui';
import { ListRowActions, ListVisibilityBadge, UBadge } from '#components';
import { useEventApi } from '~~/services/api/event.api';
import type { IEvent } from '~~/services/types/event.type';
import { EVENT_PLACES } from '~/constants/places';
import type { Meta } from '~~/services/api';

const PAGE_SIZE = 20;

const placeMap = Object.fromEntries(EVENT_PLACES.map((p) => [p.key, p.value]));

const toast = useToast();
const eventApi = useEventApi();

await redirectEditIdToPage('/event');

const { page, filters } = useListQuery({ sort: 'late' });

const events = ref<IEvent[]>([]);
const meta = ref<Meta>();
const loading = ref(false);

const fetchData = async () => {
  loading.value = true;
  try {
    const res = await eventApi.getAllEvents({
      isDeleted: true,
      limit: PAGE_SIZE,
      page: page.value,
      sortBy: 'eventTime',
      sortOrder: filters.sort === 'early' ? 'asc' : 'desc',
    });
    events.value = res.data ?? [];
    meta.value = res.meta;
  } catch {
    toast.add({ title: 'Не удалось загрузить события', color: 'error' });
  } finally {
    loading.value = false;
  }
};

await fetchData();
watch([page, () => ({ ...filters })], fetchData);

// ---------- Дата ----------

/*
 * Время события хранится «как есть» в UTC-нотации (18:30 → …T18:30:00.000Z),
 * поэтому читаем UTC-компоненты, а не локальные.
 */
const MONTHS = ['янв', 'фев', 'мар', 'апр', 'мая', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];
const WEEKDAYS = ['вс', 'пн', 'вт', 'ср', 'чт', 'пт', 'сб'];
const pad = (n: number) => String(n).padStart(2, '0');

const parts = (value: string) => {
  const d = new Date(value);
  return {
    day: d.getUTCDate(),
    month: MONTHS[d.getUTCMonth()],
    year: d.getUTCFullYear(),
    weekday: WEEKDAYS[d.getUTCDay()],
    time: `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`,
    // «день события» в тех же наивных координатах для сравнения с сегодняшним
    key: Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()),
  };
};

const todayKey = (() => {
  const now = new Date();
  return Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
})();

const timing = (value: string) => {
  const diff = Math.round((parts(value).key - todayKey) / 86_400_000);
  if (diff === 0) return { label: 'Сегодня', color: 'primary' as const };
  if (diff === 1) return { label: 'Завтра', color: 'info' as const };
  if (diff > 1 && diff <= 7) return { label: `Через ${diff} ${plural(diff, ['день', 'дня', 'дней'])}`, color: 'info' as const };
  if (diff < 0) return { label: 'Прошло', color: 'neutral' as const, past: true };
  return null;
};

// ---------- Действия ----------

const setVisibility = async (event: IEvent, isDeleted: boolean) => {
  const previous = event.isDeleted;
  event.isDeleted = isDeleted;
  try {
    await eventApi.updateEvent(event.id, { isDeleted });
    toast.add({ title: isDeleted ? 'Событие скрыто' : 'Событие опубликовано', color: 'success' });
  } catch {
    event.isDeleted = previous;
    toast.add({ title: 'Не удалось изменить видимость', color: 'error' });
  }
};

const rowActions = (event: IEvent) => [
  [{ label: 'Редактировать', icon: 'i-lucide-pencil', to: `/event/admin/${event.id}` }],
  [
    {
      label: event.isDeleted ? 'Опубликовать' : 'Скрыть с сайта',
      icon: event.isDeleted ? 'i-lucide-eye' : 'i-lucide-eye-off',
      onSelect: () => setVisibility(event, !event.isDeleted),
    },
  ],
];

// ---------- Таблица ----------

const columns: TableColumn<IEvent>[] = [
  {
    id: 'date',
    header: 'Когда',
    meta: { class: { th: 'w-40', td: 'w-40' } },
    cell: ({ row }) => {
      const p = parts(row.original.eventTime);
      const past = !!timing(row.original.eventTime)?.past;
      return h('div', { class: ['flex items-center gap-3', past && 'opacity-60'] }, [
        h('div', { class: 'flex w-12 shrink-0 flex-col items-center rounded-lg border border-default bg-elevated py-1 leading-none' }, [
          h('span', { class: 'text-lg font-semibold text-highlighted tabular-nums' }, String(p.day)),
          h('span', { class: 'text-[11px] uppercase text-muted' }, p.month),
        ]),
        h('div', { class: 'text-sm leading-tight' }, [
          h('p', { class: 'font-medium tabular-nums text-default' }, p.time),
          h('p', { class: 'text-xs text-muted' }, `${p.weekday}, ${p.year}`),
        ]),
      ]);
    },
  },
  {
    id: 'title',
    header: 'Событие',
    cell: ({ row }) => {
      const event = row.original;
      const t = timing(event.eventTime);
      return h('div', { class: 'min-w-64 max-w-2xl space-y-1 whitespace-normal' }, [
        h('p', { class: ['line-clamp-2 font-medium', t?.past ? 'text-muted' : 'text-highlighted'] }, event.title),
        h('div', { class: 'flex flex-wrap items-center gap-1.5 text-xs text-muted' }, [
          t && !t.past ? h(UBadge, { label: t.label, color: t.color, variant: 'subtle', size: 'sm' }) : null,
          h('span', { class: 'truncate' }, placeMap[event.place] ?? event.place ?? 'Место не указано'),
        ]),
      ]);
    },
  },
  {
    id: 'age',
    header: 'Возраст',
    cell: ({ row }) =>
      h(UBadge, { variant: 'outline', color: 'neutral', label: `${row.original.age ?? 0}+` }),
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

const onSelect = (_: Event, row: TableRow<IEvent>) => navigateTo(`/event/admin/${row.original.id}`);

const sortItems = [
  { label: 'Сначала поздние', value: 'late', icon: 'i-lucide-arrow-down-wide-narrow' },
  { label: 'Сначала ранние', value: 'early', icon: 'i-lucide-arrow-up-narrow-wide' },
];

useHead({ title: 'НОМБ | События' });
</script>

<template>
  <NuxtLayout
    v-model="page"
    name="table"
    title="События"
    :description="meta ? `${meta.total.toLocaleString('ru-RU')} ${plural(meta.total, ['событие', 'события', 'событий'])} в афише` : undefined"
    create-label="Новое событие"
    :meta="meta"
    :loading="loading"
    :event-create="() => navigateTo('/event/admin')"
  >
    <template #filters>
      <USelect v-model="filters.sort" :items="sortItems" size="sm" class="w-48" />
    </template>

    <UTable
      :columns="columns"
      :data="events"
      :loading="loading"
      :ui="{ thead: 'bg-elevated/50', tr: 'cursor-pointer hover:bg-elevated/40', td: 'py-3' }"
      @select="onSelect"
    >
      <template #empty>
        <ListEmpty title="Событий пока нет" icon="i-lucide-calendar-x" />
      </template>
    </UTable>
  </NuxtLayout>
</template>
