<script setup lang="ts">
import { useNotificationApi } from '~~/services/api/notification.api';
import type { TableColumn } from '@nuxt/ui';
import type { Notification } from '~~/services/types/notification.type';
import { UBadge, UButton } from '#components';
import AdminNotification from '~/components/Modals/AdminNotification.vue';

const notificationApi = useNotificationApi();
const overlay = useOverlay();

const modal = overlay.create(AdminNotification);
const notifications = ref();
const page = ref(1);

const columns: TableColumn<Notification>[] = [
  {
    accessorKey: 'isDeleted',
    header: 'Статус',
    cell: ({ row }) => {
      return h(UBadge, {
        class: 'hover:cursor-pointer',
        variant: 'subtle',
        color:
          new Date().toISOString() > row.original.endTime
            ? 'warning'
            : 'success',
        label:
          new Date().toISOString() > row.original.endTime
            ? 'Истекло'
            : 'Опубликовано',
      });
    },
  },
  {
    accessorKey: 'title',
    header: 'Название',
    cell: ({ row }) => {
      return h(
        'div',
        { class: 'text-gray-900 font-medium' },
        row.original.title
      );
    },
  },
  {
    accessorKey: 'description',
    header: 'Описание',
  },
  {
    accessorKey: 'type',
    header: 'Тип',
    cell: ({ row }) => {
      return h(
        'div',
        { class: `text-${row.original.type} font-medium` },
        row.original.type
      );
    },
  },
  {
    id: 'actions',
    header: 'Действия',
    cell: ({ row }) => {
      return h('div', { class: 'flex items-center gap-2' }, [
        h(UButton, {
          icon: 'i-heroicons-eye',
          variant: 'outline',
          color: 'neutral',
          size: 'xs',
          // to: 'http://dev.infomania.ru/entry/' + row.original.slug,
          target: '_blank',
          title: 'Посмотреть на сайте',
        }),
        h(UButton, {
          icon: 'i-heroicons-pencil-square',
          variant: 'outline',
          color: 'secondary',
          size: 'xs',
          onClick: () => handleOpenModal(row.original),
          // to: `/post/admin/${row.original.id}`,
          title: 'Редактировать',
        }),
      ]);
    },
  },
];

const fetchData = async () => {
  notifications.value = await notificationApi.getAllNotifications({
    limit: 15,
    page: page.value,
  });
};

const handleOpenModal = async (notification?: Notification) => {
  const instance = modal.open({ notification });

  const result = await instance.result;
  if (result) {
    console.log(123);
    await fetchData();
    console.log(notifications.value.data);
  }
};

await fetchData();

watch(page, () => {
  fetchData();
});

useHead({
  title: 'НОМБ | Уведомления',
});
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
      ref="table"
      class="flex-1 bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden"
      :data="notifications.data"
      :columns="columns"
      :ui="{
        thead: 'bg-gray-50 border-b border-gray-200',
        th: 'py-3 px-4 font-semibold text-gray-900 text-sm text-left whitespace-nowrap',
        tbody: 'divide-y divide-gray-200 my-table-tbody',
        td: 'py-3 px-4 align-middle group-hover:bg-gray-50 transition-colors',
        tr: 'group hover:bg-gray-50 transition-colors',
      }"
    />
  </NuxtLayout>
</template>

<style scoped></style>
