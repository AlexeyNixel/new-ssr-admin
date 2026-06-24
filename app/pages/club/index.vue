<script setup lang="ts">
import { useClubApi } from '~~/services/api/club.api';
import type { TableColumn } from '@nuxt/ui/components/Table.vue';
import { UButton } from '#components';
import type { Club } from '~~/services/types/club.type';
import AdminClub from '~/components/Modals/AdminClub.vue';

const clubApi = useClubApi();
const page = ref(1);
const overlay = useOverlay();
const modal = overlay.create(AdminClub);

const clubsRes = ref();

const fetchData = async () => {
  clubsRes.value = await clubApi.getAllClubs({
    include: 'preview',
    limit: 20,
  });
};

await fetchData();

const handleOpenModal = async (club?: Club) => {
  const instance = modal.open({ club });
  const result = await instance.result;
  if (result) {
    await fetchData();
  }
};

const columns: TableColumn<Club>[] = [
  {
    id: 'preview',
    header: 'Фото',
    cell: ({ row }) => {
      if (!row.original?.preview?.path) return h('div', { class: 'w-16 h-16 rounded-lg bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-400 text-xs' }, 'Нет фото');
      return h('img', {
        src: `http://static.infomania.ru${row.original.preview.path}`,
        class: 'w-16 h-16 object-cover rounded-lg',
        alt: row.original.name,
      });
    },
  },
  {
    accessorKey: 'name',
    header: 'Название',
    cell: ({ row }) =>
      h('p', { class: 'font-medium' }, row.original.name),
  },
  {
    id: 'worktime',
    header: 'Время работы',
    cell: ({ row }) =>
      h('div', { class: 'text-sm text-neutral-500 dark:text-neutral-400' }, row.original.worktime || '—'),
  },
  {
    id: 'member',
    header: 'Участники',
    cell: ({ row }) =>
      h('div', { class: 'text-sm text-neutral-500 dark:text-neutral-400' }, row.original.member || '—'),
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

useHead({
  title: 'НОМБ | Клубы',
});
</script>

<template>
  <NuxtLayout
    v-model="page"
    name="table"
    title="Управление клубами"
    :meta="clubsRes.meta"
    :event-create="handleOpenModal"
  >
    <UTable
      :data="clubsRes.data"
      :columns="columns"
      :ui="{ thead: 'bg-neutral-50 dark:bg-neutral-800/50' }"
    />
  </NuxtLayout>
</template>

<style scoped></style>
