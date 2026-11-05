<script setup lang="ts">
import type { TableColumn, TableRow } from '@nuxt/ui';
import { ListEmpty, ListRowActions, ListVisibilityBadge, ModalsAdminPodcast, UIcon } from '#components';
import { usePodcastApi } from '~~/services/api/podcast.api';
import type { Podcast } from '~~/services/types/podcast.type';

const toast = useToast();
const overlay = useOverlay();
const modal = overlay.create(ModalsAdminPodcast);
const podcastApi = usePodcastApi();

const podcasts = ref<Podcast[]>([]);
const loading = ref(false);

const fetchData = async () => {
  loading.value = true;
  try {
    const res = await podcastApi.getAllPodcasts({
      isDeleted: true,
      limit: 500,
      include: 'audio',
    });
    podcasts.value = res.data ?? [];
  }
  catch {
    toast.add({ title: 'Не удалось загрузить подкасты', color: 'error' });
  }
  finally {
    loading.value = false;
  }
};

await fetchData();

const openModal = async (podcast?: Podcast) => {
  const instance = modal.open({ podcast });
  const result = await instance.result;
  if (result) await fetchData();
};

useModalRouteOpener({
  modal,
  onClosed: () => fetchData(),
});

const setVisibility = async (podcast: Podcast, isDeleted: boolean) => {
  const previous = podcast.isDeleted;
  podcast.isDeleted = isDeleted;
  try {
    await podcastApi.updatePodcast(podcast.id, { isDeleted });
    toast.add({
      title: isDeleted ? 'Подкаст скрыт с сайта' : 'Подкаст снова на сайте',
      color: 'success',
    });
  }
  catch {
    podcast.isDeleted = previous;
    toast.add({ title: 'Не удалось изменить видимость', color: 'error' });
  }
};

const rowActions = (podcast: Podcast) => [
  [
    { label: 'Редактировать', icon: 'i-lucide-pencil', onSelect: () => openModal(podcast) },
  ],
  [
    {
      label: podcast.isDeleted ? 'Показать на сайте' : 'Скрыть с сайта',
      icon: podcast.isDeleted ? 'i-lucide-eye' : 'i-lucide-eye-off',
      onSelect: () => setVisibility(podcast, !podcast.isDeleted),
    },
  ],
];

const columns: TableColumn<Podcast>[] = [
  {
    id: 'title',
    header: 'Название',
    cell: ({ row }) =>
      h('div', { class: 'min-w-0' }, [
        h('p', { class: 'font-medium text-highlighted' }, row.original.title),
        row.original.description
          ? h('p', { class: 'line-clamp-1 text-xs text-muted' }, row.original.description)
          : null,
      ]),
  },
  {
    id: 'audio',
    header: 'Аудио',
    cell: ({ row }) =>
      row.original.audio?.originalName
        ? h('span', { class: 'inline-flex items-center gap-1 text-sm text-muted' }, [
            h(UIcon, { name: 'i-heroicons-musical-note', class: 'size-3.5' }),
            row.original.audio.originalName,
          ])
        : h('span', { class: 'text-sm text-muted' }, '—'),
  },
  {
    id: 'status',
    header: 'Статус',
    cell: ({ row }) =>
      h(ListVisibilityBadge, {
        hidden: row.original.isDeleted,
        shownLabel: 'На сайте',
        hiddenLabel: 'Скрыт',
        toggle: () => setVisibility(row.original, !row.original.isDeleted),
      }),
  },
  {
    id: 'createdAt',
    header: 'Создан',
    cell: ({ row }) =>
      h('span', { class: 'whitespace-nowrap text-sm text-muted' }, formatDate(row.original.createdAt)),
  },
  {
    id: 'actions',
    header: '',
    meta: { class: { td: 'w-12' } },
    cell: ({ row }) => h(ListRowActions, { items: rowActions(row.original) }),
  },
];

const onSelect = (_: Event, row: TableRow<Podcast>) => openModal(row.original);

useHead({ title: 'НОМБ | Подкасты' });
</script>

<template>
  <NuxtLayout
    name="table"
    title="Подкасты"
    :description="`${podcasts.length} ${plural(podcasts.length, ['подкаст', 'подкаста', 'подкастов'])} в книжной полке`"
    create-label="Новый подкаст"
    :loading="loading"
    :event-create="() => openModal()"
  >
    <UTable
      :columns="columns"
      :data="podcasts"
      :loading="loading"
      :ui="{ thead: 'bg-elevated/50', tr: 'cursor-pointer hover:bg-elevated/40', td: 'py-3' }"
      @select="onSelect"
    >
      <template #empty>
        <ListEmpty
          icon="i-lucide-podcast"
          title="Подкастов пока нет"
        />
      </template>
    </UTable>
  </NuxtLayout>
</template>
