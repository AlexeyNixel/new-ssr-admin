<script setup lang="ts">
import type { TableColumn, TableRow } from '@nuxt/ui';
import { ListEmpty, ListRowActions, ListVisibilityBadge, ModalsAdminAchievement } from '#components';
import { useAchievementApi } from '~~/services/api/achievement.api';
import type { Achievement } from '~~/services/types/achievement.type';

const toast = useToast();
const overlay = useOverlay();
const modal = overlay.create(ModalsAdminAchievement);
const achievementApi = useAchievementApi();

const achievements = ref<Achievement[]>([]);
const loading = ref(false);

const fetchData = async () => {
  loading.value = true;
  try {
    achievements.value = (await achievementApi.getAllAchievements()) ?? [];
  } catch {
    toast.add({ title: 'Не удалось загрузить достижения', color: 'error' });
  } finally {
    loading.value = false;
  }
};

await fetchData();

const openModal = async (achievement?: Achievement) => {
  const instance = modal.open({ achievement });
  const result = await instance.result;
  if (result) await fetchData();
};

useModalRouteOpener({
  modal,
  onClosed: () => fetchData(),
});

const setVisibility = async (achievement: Achievement, isDeleted: boolean) => {
  const previous = achievement.isDeleted;
  achievement.isDeleted = isDeleted;
  try {
    await achievementApi.updateAchievement(achievement.id, { isDeleted });
    toast.add({
      title: isDeleted ? 'Счётчик скрыт с сайта' : 'Счётчик снова на сайте',
      color: 'success',
    });
  } catch {
    achievement.isDeleted = previous;
    toast.add({ title: 'Не удалось изменить видимость', color: 'error' });
  }
};

const rowActions = (achievement: Achievement) => [
  [
    { label: 'Редактировать', icon: 'i-lucide-pencil', onSelect: () => openModal(achievement) },
  ],
  [
    {
      label: achievement.isDeleted ? 'Показать на сайте' : 'Скрыть с сайта',
      icon: achievement.isDeleted ? 'i-lucide-eye' : 'i-lucide-eye-off',
      onSelect: () => setVisibility(achievement, !achievement.isDeleted),
    },
  ],
];

const columns: TableColumn<Achievement>[] = [
  {
    id: 'label',
    header: 'Подпись',
    cell: ({ row }) =>
      h('div', { class: 'min-w-0' }, [
        h('p', { class: 'font-medium text-highlighted' }, row.original.label),
        h('p', { class: 'text-xs text-muted' }, 'Счётчик в блоке достижений'),
      ]),
  },
  {
    id: 'count',
    header: 'Значение',
    cell: ({ row }) =>
      h(
        'span',
        { class: 'text-lg font-semibold tabular-nums text-highlighted' },
        row.original.count
      ),
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

const onSelect = (_: Event, row: TableRow<Achievement>) => openModal(row.original);

useHead({ title: 'НОМБ | Достижения' });
</script>

<template>
  <NuxtLayout
    name="table"
    title="Достижения"
    :description="`${achievements.length} ${plural(achievements.length, ['счётчик', 'счётчика', 'счётчиков'])} на главной странице`"
    create-label="Новое достижение"
    :loading="loading"
    :event-create="() => openModal()"
  >
    <UTable
      :columns="columns"
      :data="achievements"
      :loading="loading"
      :ui="{ thead: 'bg-elevated/50', tr: 'cursor-pointer hover:bg-elevated/40', td: 'py-3' }"
      @select="onSelect"
    >
      <template #empty>
        <ListEmpty
          icon="i-lucide-trophy"
          title="Достижений пока нет"
        />
      </template>
    </UTable>
  </NuxtLayout>
</template>
