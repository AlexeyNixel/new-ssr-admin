<script setup lang="ts">
import { useEventApi } from '~~/services/api/event.api';
import type { TableColumn } from '#ui/components/Table.vue';
import { UBadge, UButton, ModalsAdminEvent } from '#components';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import type { IEvent } from '~~/services/types/event.type';
import { EVENT_PLACES } from '~/constants/places';

dayjs.extend(utc);

const placeMap = Object.fromEntries(EVENT_PLACES.map((p) => [p.key, p.value]));

const overlay = useOverlay();
const modal = overlay.create(ModalsAdminEvent);
const toast = useToast();
const eventApi = useEventApi();
const eventsRes = ref();
const page = ref(1);

const columns: TableColumn<IEvent>[] = [
  {
    accessorKey: 'isDeleted',
    header: 'Статус',
    cell: ({ row }) =>
      h(UBadge, {
        class: 'cursor-pointer',
        variant: 'subtle',
        color: row.original.isDeleted ? 'warning' : 'success',
        label: row.original.isDeleted ? 'Скрыто' : 'Активно',
        onClick: () => handleToggleVisibility(row.original),
      }),
  },
  {
    accessorKey: 'title',
    header: 'Название',
    cell: ({ row }) =>
      h('p', { class: 'font-medium max-w-xs' },
        row.original.title.length > 80
          ? row.original.title.slice(0, 80) + '…'
          : row.original.title
      ),
  },
  {
    accessorKey: 'eventTime',
    header: 'Дата проведения',
    cell: ({ row }) =>
      h('div', { class: 'text-sm text-neutral-500 whitespace-nowrap' },
        dayjs(row.original.eventTime).utc().format('DD.MM.YYYY HH:mm')
      ),
  },
  {
    accessorKey: 'place',
    header: 'Место',
    cell: ({ row }) =>
      h('div', { class: 'text-sm max-w-[180px]' }, placeMap[row.original.place] ?? row.original.place ?? '—'),
  },
  {
    accessorKey: 'age',
    header: 'Возраст',
    cell: ({ row }) =>
      h(UBadge, {
        variant: 'outline',
        color: 'neutral',
        label: row.original.age ? `${row.original.age}+` : '0+',
      }),
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

const handleToggleVisibility = async (event: IEvent) => {
  event.isDeleted = !event.isDeleted;
  await eventApi.updateEvent(event.id, { isDeleted: event.isDeleted });
  toast.add({
    title: event.isDeleted ? 'Событие скрыто' : 'Событие восстановлено',
    color: event.isDeleted ? 'warning' : 'success',
  });
};

const handleOpenModal = async (event?: IEvent) => {
  const instance = modal.open({ event });
  const result = await instance.result;
  if (result) await fetchData();
};

const fetchData = async () => {
  eventsRes.value = await eventApi.getAllEvents({
    isDeleted: true,
    limit: 20,
    page: page.value,
    sortBy: 'eventTime',
  });
};

await fetchData();

watch(page, () => fetchData());

useHead({ title: 'НОМБ | События' });
</script>

<template>
  <NuxtLayout
    v-model="page"
    name="table"
    title="Управление событиями"
    :meta="eventsRes.meta"
    :event-create="() => handleOpenModal()"
  >
    <UTable
      :columns="columns"
      :data="eventsRes.data"
      :ui="{ thead: 'bg-neutral-50 dark:bg-neutral-800/50' }"
    />
  </NuxtLayout>
</template>
