<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui';
import { UBadge, UButton } from '#components';
import { useGameApi } from '~~/services/api/game.api';
import dayjs from 'dayjs';
import type { Game } from '~~/services/types/game.type';
import { GAME_STATUS_OPTIONS } from '~~/services/types/game.type';
import AdminGame from '~/components/Modals/AdminGame.vue';

const toast = useToast();
const gameApi = useGameApi();
const gameRes = ref();
const page = ref(1);
const search = ref('');
const overlay = useOverlay();
const modal = overlay.create(AdminGame);

const statusLabel = (status: string) =>
  GAME_STATUS_OPTIONS.find((option) => option.value === status)?.label ?? status;

const fetchData = async () => {
  gameRes.value = await gameApi.getAllGames({
    isDeleted: true,
    limit: 20,
    page: page.value,
    search: search.value,
  });
};

await fetchData();

const columns: TableColumn<Game>[] = [
  {
    id: 'preview',
    header: 'Обложка',
    cell: ({ row }) => {
      const cover = row.original.images[0]?.file.path;
      if (!cover)
        return h('div', { class: 'w-10 h-10 rounded bg-neutral-100 dark:bg-neutral-800' });
      return h('img', {
        src: `http://static.infomania.ru${cover}`,
        class: 'w-10 h-10 object-cover rounded',
        alt: row.original.title,
      });
    },
  },
  {
    accessorKey: 'title',
    header: 'Название',
    cell: ({ row }) =>
      h('div', { class: 'flex flex-col gap-1 max-w-xs' }, [
        h('p', { class: 'font-medium' }, row.original.title),
        row.original.series
          ? h(UBadge, { variant: 'subtle', color: 'secondary', size: 'sm', class: 'w-max' }, () => row.original.series?.title)
          : null,
      ]),
  },
  {
    id: 'status',
    header: 'Статус',
    cell: ({ row }) =>
      h('div', { class: 'flex flex-col gap-1' }, [
        h(UBadge, {
          variant: 'subtle',
          color: row.original.status === 'IN_STOCK' || row.original.status === 'ON_HANDS' ? 'success' : 'warning',
          label: statusLabel(row.original.status),
          class: 'w-max',
        }),
        h(UBadge, {
          class: 'cursor-pointer w-max',
          variant: 'subtle',
          color: row.original.isDeleted ? 'warning' : 'success',
          label: row.original.isDeleted ? 'Скрыто' : 'Опубликовано',
          onClick: () => handleToggleVisibility(row.original),
        }),
      ]),
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

const handleToggleVisibility = async (game: Game) => {
  game.isDeleted = !game.isDeleted;
  await gameApi.updateGame(game.id, { isDeleted: game.isDeleted });
  toast.add({
    title: game.isDeleted ? 'Игра скрыта' : 'Игра восстановлена',
    color: game.isDeleted ? 'warning' : 'success',
  });
};

const handleOpenModal = async (game?: Game) => {
  const instance = modal.open({ game });
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

useHead({ title: 'НОМБ | Игры' });
</script>

<template>
  <NuxtLayout
    v-model="page"
    :meta="gameRes.meta"
    title="Управление играми"
    name="table"
    :search="search"
    :event-create="() => handleOpenModal()"
    @update:search="(value) => (search = value)"
  >
    <UTable
      :data="gameRes.data"
      :columns="columns"
      :ui="{ thead: 'bg-neutral-50 dark:bg-neutral-800/50' }"
    />
  </NuxtLayout>
</template>
