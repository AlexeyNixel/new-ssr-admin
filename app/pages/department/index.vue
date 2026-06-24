<script setup lang="ts">
import { ModalsAdminDepartment, UBadge, UButton } from '#components';
import dayjs from 'dayjs';
import type { Department } from '~~/services/types/department.type';
import type { TableColumn } from '#ui/components/Table.vue';
import { useDepartmentApi } from '~~/services/api/department.api';

const toast = useToast();
const overlay = useOverlay();
const departmentApi = useDepartmentApi();
const modal = overlay.create(ModalsAdminDepartment);

const page = ref(1);
const departmentsRes = ref();

const columns: TableColumn<Department>[] = [
  {
    accessorKey: 'isDeleted',
    header: 'Статус',
    cell: ({ row }) =>
      h(UBadge, {
        class: 'cursor-pointer',
        variant: 'subtle',
        color: row.original.isDeleted ? 'warning' : 'success',
        label: row.original.isDeleted ? 'Скрыто' : 'Опубликовано',
        onClick: () => handleToggleVisibility(row.original),
      }),
  },
  {
    accessorKey: 'title',
    header: 'Название',
    cell: ({ row }) =>
      h('p', { class: 'font-medium' }, row.original.title),
  },
  {
    accessorKey: 'slug',
    header: 'Slug',
    cell: ({ row }) =>
      h('code', { class: 'text-xs bg-neutral-100 dark:bg-neutral-800 px-1.5 py-0.5 rounded' }, row.original.slug || '—'),
  },
  {
    accessorKey: 'createdAt',
    header: 'Дата создания',
    cell: ({ row }) =>
      h('div', { class: 'text-sm text-neutral-500' }, dayjs(row.original.createdAt).format('DD.MM.YYYY')),
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

const handleOpenModal = async (department?: Department) => {
  const instance = modal.open({ department });
  const result = await instance.result;
  if (result) await fetchData();
};

const handleToggleVisibility = async (department: Department) => {
  department.isDeleted = !department.isDeleted;
  await departmentApi.updateDepartment(department.id, { isDeleted: department.isDeleted });
  toast.add({
    title: department.isDeleted ? 'Отдел скрыт' : 'Отдел восстановлен',
    color: department.isDeleted ? 'warning' : 'success',
  });
};

const fetchData = async () => {
  departmentsRes.value = await departmentApi.getAllDepartments({
    isDeleted: true,
    limit: 20,
    page: page.value,
  });
};

await fetchData();

watch(page, () => fetchData());

useHead({ title: 'НОМБ | Отделы' });
</script>

<template>
  <NuxtLayout
    v-model="page"
    name="table"
    title="Управление отделами"
    :meta="departmentsRes.meta"
    :event-create="handleOpenModal"
  >
    <UTable
      :columns="columns"
      :data="departmentsRes.data"
      :ui="{ thead: 'bg-neutral-50 dark:bg-neutral-800/50' }"
    />
  </NuxtLayout>
</template>
