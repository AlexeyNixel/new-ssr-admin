<template>
  <NuxtLayout
    v-model="page"
    title="Управление тэгами"
    name="table"
    :meta="tagRes.meta"
  >
    <UTable :columns="columns" :data="tagRes.data" />
  </NuxtLayout>
</template>

<script setup lang="ts">
import { useTagApi } from '~~/services/api/tag.api';
import type { TableColumn } from '#ui/components/Table.vue';
import type { Tag } from '~~/services/types/tag.type';

const tagApi = useTagApi();
const tagRes = ref();

const page = ref(1);

const columns: TableColumn<Tag>[] = [
  {
    accessorKey: 'title',
    header: 'Название',
  },
];

const fetchData = async () => {
  tagRes.value = await tagApi.getAllTags({
    page: page.value,
  });
};

await fetchData();

watch(page, async () => {
  await fetchData();
});
</script>

<style scoped></style>
