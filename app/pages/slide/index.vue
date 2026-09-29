<script setup lang="ts">
import { useSlideApi } from '~~/services/api/slide.api';
import type { TableColumn, TableRow } from '#ui/components/Table.vue';
import type { Slide } from '~~/services/types/slide.type';
import dayjs from 'dayjs';
import { UBadge, UButton } from '#components';

const slideApi = useSlideApi();
const slidesRes = ref();
const page = ref(1);

await redirectEditIdToPage('/slide');

const onSelect = (_: Event, row: TableRow<Slide>) => {
  navigateTo(`/slide/admin/${row.original.id}`);
};

const columns: TableColumn<Slide>[] = [
  {
    accessorKey: 'isDeleted',
    header: 'Статус',
    cell: ({ row }) =>
      h(UBadge, {
        variant: 'subtle',
        color: row.original.isDeleted ? 'warning' : 'success',
        label: row.original.isDeleted ? 'Скрыт' : 'Активен',
      }),
  },
  {
    id: 'preview',
    header: 'Изображение',
    cell: ({ row }) => {
      if (!row.original.image?.path)
        return h('div', { class: 'w-32 aspect-[127/50] rounded bg-neutral-100 dark:bg-neutral-800' });
      return h('img', {
        src: `http://static.infomania.ru${row.original.image.path}`,
        class: 'w-32 aspect-[127/50] object-cover rounded',
        alt: row.original.image.originalName,
      });
    },
  },
  {
    id: 'name',
    header: 'Файл',
    cell: ({ row }) =>
      h('p', { class: 'text-sm font-medium' }, row.original.image?.originalName ?? '—'),
  },
  {
    accessorKey: 'slideOrder',
    header: 'Порядок',
    cell: ({ row }) =>
      h('div', { class: 'text-sm text-center font-mono text-neutral-500' }, row.original.slideOrder ?? 0),
  },
  {
    accessorKey: 'createdAt',
    header: 'Дата создания',
    cell: ({ row }) =>
      h('div', { class: 'text-sm text-neutral-500 whitespace-nowrap' },
        dayjs(row.original.createdAt).format('DD.MM.YYYY')
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
        to: `/slide/admin/${row.original.id}`,
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

watch(page, () => fetchData());

useHead({ title: 'НОМБ | Слайды' });
</script>

<template>
  <NuxtLayout
    v-model="page"
    name="table"
    title="Управление слайдами"
    :meta="slidesRes.meta"
    :event-create="() => navigateTo('/slide/admin')"
  >
    <UTable
      :columns="columns"
      :data="slidesRes.data"
      :ui="{ thead: 'bg-neutral-50 dark:bg-neutral-800/50', tr: 'cursor-pointer' }"
      @select="onSelect"
    />
  </NuxtLayout>
</template>
