<script setup lang="ts">
import { useSlideApi } from '~~/services/api/slide.api';
import type { TableColumn } from '#ui/components/Table.vue';
import type { Slide } from '~~/services/types/slide.type';
import dayjs from 'dayjs';
import { ModalsAdminSlide, UBadge, UButton } from '#components';

const slideApi = useSlideApi();
const { data: slides } = await slideApi.getAllSlides({
  isDeleted: true,
  limit: 20,
  include: '',
});

const overlay = useOverlay();
const modal = overlay.create(ModalsAdminSlide);

const handleOpen = (slide?: Slide) => {
  modal.open({ slide: slide });
};

const columns: TableColumn<Slide>[] = [
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
    accessorKey: 'isDeleted',
    header: 'Статус',
    cell: ({ row }) => {
      return h(UBadge, {
        class: 'hover:cursor-pointer',
        color: row.original.isDeleted ? 'error' : 'success',
        label: row.original.isDeleted ? 'Скрыта' : 'Активна',
      });
    },
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
        onClick: () => handleOpen(row.original),
        label: 'Обновить',
      }),
  },
];
</script>

<template>
  <div>
    <UTable :columns="columns" :data="slides" />
    <UButton
      class="absolute top-2 right-2"
      label="Создать слайд"
      @click="handleOpen"
    />
  </div>
</template>

<style scoped></style>
