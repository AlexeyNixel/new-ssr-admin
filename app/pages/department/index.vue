<script setup lang="ts">
import { ModalsAdminDepartment, UBadge, UButton } from '#components';
import dayjs from 'dayjs';
import { useDepartmentStore } from '~/stores/department.store';
import type { Department } from '~~/services/types/department.type';
import type { TableColumn } from '#ui/components/Table.vue';

const toast = useToast();

const departmentStore = useDepartmentStore();
const { departments } = storeToRefs(departmentStore);

const overlay = useOverlay();
const modal = overlay.create(ModalsAdminDepartment);

const page = ref(1);

const fetchData = async () => {
  await departmentStore.getDepartments({
    isDeleted: true,
    limit: 15,
    page: page.value,
  });
};

await fetchData();

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
    accessorKey: 'slug',
    header: 'Slug',
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
        label: 'Обновить',
        icon: 'i-solar-refresh-outline',
        onClick: () => handleOpenModalUpdate(row.original),
      });
    },
  },
];

const handleOpenModalCreate = () => {
  modal.open();
};

const handleOpenModalUpdate = (department: Department) => {
  modal.open({ department: department });
};

const handleHideDepartment = async (department: Department) => {
  try {
    department.isDeleted = !department.isDeleted;
    await departmentStore.updateDepartments(department.id, {
      isDeleted: department.isDeleted,
    });

    toast.add({
      title: department.isDeleted ? 'Отдел скрыт' : 'Отдел восстановлен',
      color: 'success',
    });
  } catch {
    toast.add({
      title: 'Произошла ошибка проверьте введеные данные',
      color: 'warning',
    });
  }
};
</script>

<template>
  <div class="flex flex-col justify-between h-full">
    <UTable :columns="columns" :data="departments?.data" />
    <UPagination
      v-if="departments?.meta?.hasNext || departments?.meta?.hasPrev"
      v-model:page="page"
      class="bottom-10 flex justify-center mb-10"
      :total="departments?.meta?.total"
      :items-per-page="Number(departments?.meta?.limit)"
      @update:page="fetchData"
    />
    <UButton
      class="absolute top-2 right-2"
      label="Добавить отдел"
      @click="handleOpenModalCreate"
    />
  </div>
</template>

<style scoped></style>
