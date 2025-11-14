<script setup lang="ts">
import { usePostApi } from '~~/services/api/post.api';
import type { TableColumn } from '#ui/components/Table.vue';
import type { Department } from '~~/services/types/department.type';
import { UBadge, UButton } from '#components';
import dayjs from 'dayjs';

const postApi = usePostApi();

const { data } = await postApi.getAllPosts({
  limit: 30,
  isDeleted: true,
  sortBy: 'createdAt',
});

const columns: TableColumn<Department>[] = [
  {
    accessorKey: 'isDeleted',
    header: 'Статус',
    cell: ({ row }) => {
      return h(UBadge, {
        class: 'hover:cursor-pointer',
        color: row.original.isDeleted ? 'error' : 'success',
        label: row.original.isDeleted ? 'Скрыта' : 'Активна',
        onClick: () => handleHideDepartment(row.original),
      });
    },
  },
  {
    accessorKey: 'title',
    header: 'Название',
  },
  {
    accessorKey: 'createdAt',
    header: 'Дата создания',
    cell: ({ row }) => {
      return h('div', dayjs(row.original.createdAt).format('DD.MM.YYYY'));
    },
  },
  {
    id: 'actions',
    cell: ({ row }) => {
      return h(UButton, {
        icon: 'i-lucide-link',
        variant: 'link',
        to: 'http://dev.infomania.ru/entry/' + row.original.slug,
        target: '_blank',
      });
    },
  },
  {
    id: 'actions',
    cell: ({ row }) => {
      return h(UButton, {
        label: 'Обновить',
        icon: 'i-solar-refresh-outline',
        onClick: () =>
          navigateTo({
            path: '/post/admin/' + row.original.id,
          }),
      });
    },
  },
];
</script>

<template>
  <div class="flex flex-col justify-between h-full">
    <UTable :columns="columns" :data="data" />
    <!--    <UPagination-->
    <!--      v-if="departments?.meta?.hasNext || departments?.meta?.hasPrev"-->
    <!--      v-model:page="page"-->
    <!--      class="bottom-10 flex justify-center mb-10"-->
    <!--      :total="departments?.meta?.total"-->
    <!--      :items-per-page="Number(departments?.meta?.limit)"-->
    <!--      @update:page="fetchData"-->
    <!--    />-->
    <UButton class="absolute top-2 right-2" label="Добавить пост" />
  </div>
</template>
