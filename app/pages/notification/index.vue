<script setup lang="ts">
import { useNotificationApi } from '~~/services/api/notification.api';
import type { TableColumn } from '@nuxt/ui';
import type { Notification } from '~~/services/types/notification.type';
import { UBadge, UButton } from '#components';
import AdminNotification from '~/components/Modals/AdminNotification.vue';
import dayjs from 'dayjs';

const TYPE_LABELS: Record<Notification['type'], { label: string; color: 'error' | 'warning' | 'success' }> = {
  error: { label: 'Ошибка', color: 'error' },
  warning: { label: 'Предупреждение', color: 'warning' },
  success: { label: 'Успех', color: 'success' },
};

const notificationApi = useNotificationApi();
const overlay = useOverlay();
const modal = overlay.create(AdminNotification);
const notifications = ref();
const page = ref(1);

const isExpired = (endTime: string) => new Date().toISOString() > endTime;

const columns: TableColumn<Notification>[] = [
  {
    id: 'status',
    header: 'Статус',
    cell: ({ row }) =>
      h('div', { class: 'flex flex-col gap-1' }, [
        h(UBadge, {
          variant: 'subtle',
          color: isExpired(row.original.endTime) ? 'neutral' : 'success',
          label: isExpired(row.original.endTime) ? 'Истекло' : 'Активно',
        }),
        h(UBadge, {
          variant: 'subtle',
          color: TYPE_LABELS[row.original.type]?.color ?? 'neutral',
          label: TYPE_LABELS[row.original.type]?.label ?? row.original.type,
          class: 'w-max',
        }),
      ]),
  },
  {
    accessorKey: 'title',
    header: 'Название',
    cell: ({ row }) =>
      h('div', { class: 'space-y-0.5' }, [
        h('p', { class: 'font-medium' }, row.original.title),
        row.original.description
          ? h('p', { class: 'text-xs text-neutral-400 max-w-xs' },
              row.original.description.length > 80
                ? row.original.description.slice(0, 80) + '…'
                : row.original.description
            )
          : null,
      ]),
  },
  {
    id: 'period',
    header: 'Период показа',
    cell: ({ row }) =>
      h('div', { class: 'text-sm text-neutral-500 whitespace-nowrap space-y-0.5' }, [
        h('div', { class: 'flex items-center gap-1' }, [
          h('span', { class: 'text-xs text-neutral-400' }, 'С'),
          h('span', dayjs(row.original.startTime).format('DD.MM.YYYY HH:mm')),
        ]),
        h('div', { class: 'flex items-center gap-1' }, [
          h('span', { class: 'text-xs text-neutral-400' }, 'До'),
          h('span', {
            class: isExpired(row.original.endTime) ? 'text-red-500' : '',
          }, dayjs(row.original.endTime).format('DD.MM.YYYY HH:mm')),
        ]),
      ]),
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

const fetchData = async () => {
  notifications.value = await notificationApi.getAllNotifications({
    limit: 15,
    page: page.value,
    isDeleted: true,
  });
};

const handleOpenModal = async (notification?: Notification) => {
  const instance = modal.open({ notification });
  const result = await instance.result;
  if (result) await fetchData();
};

await fetchData();

watch(page, () => fetchData());

useHead({ title: 'НОМБ | Уведомления' });
</script>

<template>
  <NuxtLayout
    v-model="page"
    :meta="notifications.meta"
    title="Управление уведомлениями"
    name="table"
    :event-create="() => handleOpenModal()"
  >
    <UTable
      :data="notifications.data"
      :columns="columns"
      :ui="{ thead: 'bg-neutral-50 dark:bg-neutral-800/50' }"
    />
  </NuxtLayout>
</template>
