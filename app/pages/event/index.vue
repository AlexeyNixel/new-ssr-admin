<script setup lang="ts">
import { useEventApi } from '~~/services/api/event.api';
import type { TableColumn } from '#ui/components/Table.vue';

import { UBadge, UButton, ModalsAdminEvent } from '#components';
import dayjs from 'dayjs';
import type { IEvent } from '~~/services/types/event.type';

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
    cell: ({ row }) => {
      return h(UBadge, {
        class: 'hover:cursor-pointer',
        variant: 'subtle',
        color: row.original.isDeleted ? 'warning' : 'success',
        label: row.original.isDeleted ? 'Скрыта' : 'Опубликована',
        onClick: () => handleDeleteEvent(row.original),
      });
    },
  },
  {
    accessorKey: 'title',
    header: 'Название',
    cell: ({ row }) => {
      return h(
        'div',
        { class: 'font-medium text-gray-900 text-wrap' },
        row.original.title.length > 150
          ? row.original.title.substring(0, 150) + '...'
          : row.original.title
      );
    },
  },
  {
    accessorKey: 'createdAt',
    header: 'Дата создания',
    cell: ({ row }) => {
      return h(
        'div',
        dayjs(row.original.eventTime).utc().format('DD.MM.YYYY HH:mm')
      );
    },
  },
  {
    id: 'actions',
    cell: ({ row }) => {
      return h(UButton, {
        variant: 'subtle',
        color: 'secondary',
        icon: 'i-heroicons-pencil-square',
        onClick: () => handleOpenModal(row.original),
      });
    },
  },
];

const handleDeleteEvent = async (event: IEvent) => {
  event.isDeleted = !event.isDeleted;
  await eventApi.updateEvent(event.id, { isDeleted: event.isDeleted });
  toast.add({
    title: event.isDeleted ? 'Событие скрыто' : 'Событие восстановлено',
    color: event.isDeleted ? 'warning' : 'success',
  });
};

const handleOpenModal = async (event?: IEvent) => {
  modal.open({ event: event });
};

const fetchData = async () => {
  eventsRes.value = await eventApi.getAllEvents({
    isDeleted: true,
    limit: 20,
    page: page.value,
    sortBy: 'createdAt',
  });
};

await fetchData();

watch(page, () => {
  fetchData();
});
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
      :ui="{
        thead: 'bg-gray-50',
      }"
      :columns="columns"
      :data="eventsRes.data"
    />
  </NuxtLayout>
</template>

<style scoped></style>
