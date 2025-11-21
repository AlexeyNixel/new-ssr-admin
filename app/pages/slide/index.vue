<script setup lang="ts">
import { useSlideApi } from '~~/services/api/slide.api';
import type { TableColumn } from '#ui/components/Table.vue';
import type { Slide } from '~~/services/types/slide.type';
import dayjs from 'dayjs';
import { ModalsAdminSlide, UBadge, UButton } from '#components';

const overlay = useOverlay();
const slideApi = useSlideApi();

const slidesRes = ref();
const page = ref(1);

const modal = overlay.create(ModalsAdminSlide);

const handleOpenModal = (slide?: Slide) => {
  modal.open({ slide: slide });
};

const columns: TableColumn<Slide>[] = [
  {
    accessorKey: 'isDeleted',
    header: 'Статус',
    cell: ({ row }) => {
      return h(UBadge, {
        class: 'hover:cursor-pointer',
        variant: 'subtle',
        color: row.original.isDeleted ? 'warning' : 'success',
        label: row.original.isDeleted ? 'Скрыта' : 'Опубликован',
      });
    },
  },
  {
    id: 'preview',
    header: 'Изображение',
    cell: ({ row }) =>
      h('img', {
        src: `http://static.infomania.ru${row.original.image.path}`,
        style: 'width:200px',
      }),
  },
  {
    accessorKey: 'image',
    header: 'Название',
    cell: ({ row }) => h('div', row.original.image.originalName),
  },

  {
    accessorKey: 'createdAt',
    header: 'Дата создания',
    cell: ({ row }) =>
      h('div', dayjs(row.original.createdAt).format('DD.MM.YYYY')),
  },
  {
    id: 'action',
    cell: ({ row }) =>
      h(UButton, {
        variant: 'subtle',
        color: 'secondary',
        icon: 'i-heroicons-pencil-square',
        onClick: () => handleOpenModal(row.original),
      }),
  },
];

const fetchData = async () => {
  slidesRes.value = await slideApi.getAllSlides({
    isDeleted: true,
    limit: 20,
    include: '',
    page: page.value,
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
    title="Управление слайдами"
    :meta="slidesRes.meta"
    :event-create="handleOpenModal"
  >
    <UTable
      :columns="columns"
      :data="slidesRes.data"
      :ui="{
        thead: 'bg-gray-50',
      }"
    />
  </NuxtLayout>
</template>

<style scoped></style>
