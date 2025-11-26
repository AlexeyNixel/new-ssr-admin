<script setup lang="ts">
import { ModalsAdminDepartment, UBadge, UButton } from '#components';
import dayjs from 'dayjs';
import type { Department } from '~~/services/types/department.type';
import type { TableColumn } from '#ui/components/Table.vue';
import { useDepartmentApi } from '~~/services/api/department.api';

const limit = 9;
const isDeleted = true;

const toast = useToast();
const overlay = useOverlay();
const departmentApi = useDepartmentApi();

const modal = overlay.create(ModalsAdminDepartment);

const page = ref(1);
const departmentsRes = ref();
const openModal = ref();

const columns: TableColumn<Department>[] = [
  {
    accessorKey: 'isDeleted',
    header: 'Статус',
    cell: ({ row }) => {
      return h(UBadge, {
        class: 'hover:cursor-pointer',
        variant: 'subtle',
        color: row.original.isDeleted ? 'warning' : 'success',
        label: row.original.isDeleted ? 'Скрыта' : 'Опубликована',
        onClick: () => handleHideDepartment(row.original),
      });
    },
  },
  {
    accessorKey: 'title',
    header: 'Название',
    cell: ({ row }) =>
      h('div', { class: 'text-gray-900 font-medium' }, row.original.title),
  },
  {
    accessorKey: 'slug',
    header: 'Slug',
  },
  {
    accessorKey: 'createdAt',
    header: 'Дата создания',
    cell: ({ row }) => {
      return h('div', dayjs(row.original.createdAt).format('DD.MM.YYYY HH:mm'));
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

const handleOpenModal = async (department?: Department) => {
  const instance = modal.open({ department: department });
  const result = await instance.result;

  if (result) {
    await fetchData();
  }
};

const handleHideDepartment = async (department: Department) => {
  department.isDeleted = !department.isDeleted;

  await departmentApi.updateDepartment(department.id, {
    isDeleted: department.isDeleted,
  });

  toast.add({
    title: department.isDeleted ? 'Отдел скрыт' : 'Отдел восстановлен',
    color: 'success',
  });
};

const fetchData = async () => {
  departmentsRes.value = await departmentApi.getAllDepartments({
    isDeleted,
    limit,
    page: page.value,
  });
};

await fetchData();

watch(page, () => {
  fetchData();
});

watch(openModal, () => {
  console.log(openModal.value);
});

useHead({
  title: 'Управление отделами',
});
</script>

<template>
  <NuxtLayout
    v-model="page"
    name="table"
    title="Управление отделами"
    :meta="departmentsRes.meta"
    :event-create="handleOpenModal"
  >
    {{ openModal }}
    <UTable
      :ui="{
        thead: 'bg-gray-50',
      }"
      :columns="columns"
      :data="departmentsRes.data"
    />
  </NuxtLayout>
</template>

<style scoped></style>
