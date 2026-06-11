<script setup lang="ts">
import { useClubApi } from '~~/services/api/club.api';
import type { TableColumn } from '@nuxt/ui/components/Table.vue';
import { UButton } from '#components';
import type { Club } from '~~/services/types/club.type';
import AdminClub from '~/components/Modals/AdminClub.vue';

const clubApi = useClubApi();
const page = ref(1);
const overlay = useOverlay();
const modal = overlay.create(AdminClub)

const clubs = await clubApi.getAllClubs({
  include: 'preview',
  limit: 20,
});

const columns: TableColumn<Club>[] = [
  // {
  //   accessorKey: 'isDeleted',
  //   header: 'Статус',
  //   cell: ({ row }) => {
  //     return h(UBadge, {
  //       class: 'hover:cursor-pointer w-max',
  //       variant: 'subtle',
  //       color: row.original.isDeleted ? 'warning' : 'success',
  //       label: row.original.isDeleted ? 'Скрыта' : 'Опубликована',
  //       onClick: () => handleHideDepartment(row.original),
  //     });
  //   },
  // },
  {
    accessorKey: 'name',
    header: 'Название',
  },
  {
    id: 'actions',
    accessorKey: 'Действия',
    cell: ({ row }) => {
      return h('div', { class: 'flex items-center gap-2' }, [
        h(UButton, {
          icon: 'i-heroicons-pencil-square',
          variant: 'outline',
          color: 'secondary',
          size: 'xs',
          onClick: () => modal.open({club: row.original}),
          label: 'Редактировать',
        }),
      ]);
    },
  },
];
</script>

<template>
  <NuxtLayout
    v-model="page"
    name="table"
    title="Управление клубами"
    :meta="clubs.meta"
  >
    <UTable :data="clubs.data" :columns="columns" />
  </NuxtLayout>
</template>

<style scoped></style>
