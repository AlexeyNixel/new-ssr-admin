<script setup lang="ts">
import type { TableColumn, TableRow } from '@nuxt/ui';
import { ListRowActions, ListThumb, ListVisibilityBadge, UBadge, UIcon } from '#components';
import { useGameApi } from '~~/services/api/game.api';
import type { Game, GameStatus } from '~~/services/types/game.type';
import { GAME_STATUS_OPTIONS } from '~~/services/types/game.type';
import type { Meta } from '~~/services/api';

const PAGE_SIZE = 20;

const toast = useToast();
const gameApi = useGameApi();

await redirectEditIdToPage('/game');

const { page, search, filters } = useListQuery({ status: 'all' });

const games = ref<Game[]>([]);
const meta = ref<Meta>();
const loading = ref(false);
const counts = reactive({ all: 0, published: 0 });

const fetchData = async () => {
  loading.value = true;
  try {
    const res = await gameApi.getAllGames({
      limit: PAGE_SIZE,
      page: page.value,
      search: search.value || undefined,
      // наличие isDeleted = «включая скрытые»; без него — только опубликованные
      ...(filters.status === 'all' ? { isDeleted: true } : {}),
    });
    games.value = res.data ?? [];
    meta.value = res.meta;
  } catch {
    toast.add({ title: 'Не удалось загрузить игры', color: 'error' });
  } finally {
    loading.value = false;
  }
};

const fetchCounts = async () => {
  const [all, published] = await Promise.allSettled([
    gameApi.getAllGames({ limit: 1, isDeleted: true }),
    gameApi.getAllGames({ limit: 1 }),
  ]);
  if (all.status === 'fulfilled') counts.all = all.value.meta?.total ?? 0;
  if (published.status === 'fulfilled') counts.published = published.value.meta?.total ?? 0;
};

await Promise.all([fetchData(), fetchCounts()]);
watch([page, search, () => ({ ...filters })], fetchData);

// ---------- Наличие в фонде ----------

const STATUS_COLORS: Record<GameStatus, 'success' | 'info' | 'warning' | 'error' | 'neutral'> = {
  IN_STOCK: 'success',
  ON_HANDS: 'info',
  TEMPORARILY_UNAVAILABLE: 'warning',
  WRITTEN_OFF: 'neutral',
  LOST: 'error',
  DAMAGED: 'error',
};
const statusLabel = (status: GameStatus) =>
  GAME_STATUS_OPTIONS.find((option) => option.value === status)?.label ?? status;

// ---------- Действия ----------

const setVisibility = async (game: Game, isDeleted: boolean) => {
  const previous = game.isDeleted;
  game.isDeleted = isDeleted;
  try {
    await gameApi.updateGame(game.id, { isDeleted });
    counts.published += isDeleted ? -1 : 1;
    toast.add({ title: isDeleted ? 'Игра скрыта' : 'Игра опубликована', color: 'success' });
  } catch {
    game.isDeleted = previous;
    toast.add({ title: 'Не удалось изменить видимость', color: 'error' });
  }
};

const rowActions = (game: Game) => [
  [
    { label: 'Редактировать', icon: 'i-lucide-pencil', to: `/game/admin/${game.id}` },
    ...(game.videoUrl
      ? [{ label: 'Видео с правилами', icon: 'i-lucide-play-circle', to: game.videoUrl, target: '_blank' }]
      : []),
    ...(game.rulesFile?.path
      ? [{ label: 'Файл с правилами', icon: 'i-lucide-file-text', to: staticUrl(game.rulesFile.path), target: '_blank' }]
      : []),
  ],
  [
    {
      label: game.isDeleted ? 'Опубликовать' : 'Скрыть с сайта',
      icon: game.isDeleted ? 'i-lucide-eye' : 'i-lucide-eye-off',
      onSelect: () => setVisibility(game, !game.isDeleted),
    },
  ],
];

// ---------- Таблица ----------

const paramChip = (icon: string, text: string) =>
  h('span', { class: 'inline-flex items-center gap-1 whitespace-nowrap' }, [
    h(UIcon, { name: icon, class: 'size-3.5 text-dimmed' }),
    text,
  ]);

const columns: TableColumn<Game>[] = [
  {
    id: 'cover',
    header: '',
    meta: { class: { th: 'w-16', td: 'w-16' } },
    cell: ({ row }) => h(ListThumb, { path: row.original.images?.[0]?.file?.path, icon: 'i-lucide-dices' }),
  },
  {
    id: 'title',
    header: 'Игра',
    cell: ({ row }) => {
      const game = row.original;
      const genres = (game.genres ?? []).map(({ genre }) => genre.title);
      return h('div', { class: 'min-w-60 max-w-md space-y-1 whitespace-normal' }, [
        h('p', { class: 'line-clamp-2 font-medium text-highlighted' }, game.title),
        h('div', { class: 'flex flex-wrap items-center gap-1 text-xs text-muted' }, [
          game.series
            ? h(UBadge, { label: game.series.title, color: 'secondary', variant: 'subtle', size: 'sm' })
            : null,
          ...genres.slice(0, 2).map((title) => h(UBadge, { label: title, color: 'neutral', variant: 'outline', size: 'sm' })),
          genres.length > 2 ? h('span', `+${genres.length - 2}`) : null,
        ]),
      ]);
    },
  },
  {
    id: 'params',
    header: 'Параметры',
    cell: ({ row }) => {
      const g = row.original;
      const players = formatRange(g.playerMin, g.playerMax);
      const duration = formatRange(g.durationMin, g.durationMax);
      const chips = [
        players && paramChip('i-lucide-users', players),
        duration && paramChip('i-lucide-timer', `${duration} мин`),
        g.playerAge != null && paramChip('i-lucide-baby', `${g.playerAge}+`),
      ].filter(Boolean);
      return chips.length
        ? h('div', { class: 'flex flex-wrap gap-x-3 gap-y-1 text-sm text-default' }, chips)
        : h('span', { class: 'text-sm text-dimmed' }, 'Не указаны');
    },
  },
  {
    id: 'stock',
    header: 'В фонде',
    cell: ({ row }) =>
      h('div', { class: 'space-y-0.5' }, [
        h(UBadge, {
          label: statusLabel(row.original.status),
          color: STATUS_COLORS[row.original.status] ?? 'neutral',
          variant: 'subtle',
          class: 'w-max',
        }),
        row.original.place ? h('p', { class: 'truncate text-xs text-muted' }, row.original.place) : null,
      ]),
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

const onSelect = (_: Event, row: TableRow<Game>) => navigateTo(`/game/admin/${row.original.id}`);

const statusItems = computed(() => [
  { label: `Все · ${counts.all}`, value: 'all' },
  { label: `На сайте · ${counts.published}`, value: 'published' },
]);

const resetFilters = () => {
  search.value = '';
  filters.status = 'all';
};

useHead({ title: 'НОМБ | Игры' });
</script>

<template>
  <NuxtLayout
    v-model="page"
    v-model:search="search"
    name="table"
    title="Настольные игры"
    :description="`${counts.all} ${plural(counts.all, ['игра', 'игры', 'игр'])} в каталоге, скрыто ${Math.max(0, counts.all - counts.published)}`"
    create-label="Новая игра"
    search-placeholder="Поиск по названию…"
    :meta="meta"
    :loading="loading"
    :event-create="() => navigateTo('/game/admin')"
  >
    <template #filters>
      <UTabs v-model="filters.status" :items="statusItems" :content="false" size="sm" />
    </template>

    <UTable
      :columns="columns"
      :data="games"
      :loading="loading"
      :ui="{ thead: 'bg-elevated/50', tr: 'cursor-pointer hover:bg-elevated/40', td: 'py-3' }"
      @select="onSelect"
    >
      <template #empty>
        <ListEmpty :searching="!!search || filters.status !== 'all'" title="Игр пока нет" @reset="resetFilters" />
      </template>
    </UTable>
  </NuxtLayout>
</template>
