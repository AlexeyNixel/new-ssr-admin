<script setup lang="ts">
import { useMapPointApi } from '~~/services/api/map-point.api';
import type { TableColumn } from '#ui/components/Table.vue';
import { UBadge, UButton, ModalsAdminMapPoint } from '#components';
import type { IMapPoint } from '~~/services/types/map-point.type';

const overlay = useOverlay();
const modal = overlay.create(ModalsAdminMapPoint);
const toast = useToast();
const mapPointApi = useMapPointApi();
const mapPointsRes = ref();
const page = ref(1);

const columns: TableColumn<IMapPoint>[] = [
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
      h('p', { class: 'font-medium max-w-xs' }, row.original.title),
  },
  {
    accessorKey: 'lat',
    header: 'Координаты',
    cell: ({ row }) =>
      h(
        'div',
        { class: 'text-sm text-neutral-500 whitespace-nowrap' },
        `${row.original.lat}, ${row.original.lng}`
      ),
  },
  {
    accessorKey: 'preset',
    header: 'Пресет',
    cell: ({ row }) =>
      h(
        'code',
        { class: 'text-xs bg-neutral-100 dark:bg-neutral-800 px-1.5 py-0.5 rounded' },
        row.original.preset || '—'
      ),
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

const handleToggleVisibility = async (mapPoint: IMapPoint) => {
  mapPoint.isDeleted = !mapPoint.isDeleted;
  await mapPointApi.updateMapPoint(mapPoint.id, { isDeleted: mapPoint.isDeleted });
  toast.add({
    title: mapPoint.isDeleted ? 'Точка скрыта' : 'Точка восстановлена',
    color: mapPoint.isDeleted ? 'warning' : 'success',
  });
};

const handleOpenModal = async (mapPoint?: IMapPoint) => {
  const instance = modal.open({ mapPoint });
  const result = await instance.result;
  if (result) await fetchData();
};

const fetchData = async () => {
  mapPointsRes.value = await mapPointApi.getAllMapPoints({
    isDeleted: true,
    limit: 20,
    page: page.value,
  });
};

await fetchData();

watch(page, () => fetchData());

useHead({ title: 'НОМБ | Точки на карте' });
</script>

<template>
  <NuxtLayout
    v-model="page"
    name="table"
    title="Управление точками на карте"
    :meta="mapPointsRes.meta"
    :event-create="() => handleOpenModal()"
  >
    <UTable
      :columns="columns"
      :data="mapPointsRes.data"
      :ui="{ thead: 'bg-neutral-50 dark:bg-neutral-800/50' }"
    />
  </NuxtLayout>
</template>
