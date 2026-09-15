<script setup lang="ts">
import { useComicApi } from '~~/services/api/comic.api';
import type { ComicSeries } from '~~/services/types/comic.type';

const emit = defineEmits(['update:modelValue']);
const props = defineProps<{
  modelValue: string | undefined;
}>();

const toast = useToast();
const comicApi = useComicApi();

const seriesList = ref<ComicSeries[]>([]);
const seriesId = ref(props.modelValue);

seriesList.value = await comicApi.getAllSeries();

const onCreate = async (title: string) => {
  const series = (await comicApi.createSeries({ title })) as ComicSeries;
  toast.add({ title: 'Серия создана' });
  seriesId.value = series.id;
  seriesList.value.push(series);
  emit('update:modelValue', seriesId.value);
};
</script>

<template>
  <USelectMenu
    v-model="seriesId"
    :items="seriesList"
    label-key="title"
    value-key="id"
    placeholder="Не входит в серию"
    class="w-full"
    create-item
    @update:model-value="emit('update:modelValue', seriesId)"
    @create="onCreate"
  />
</template>

<style scoped></style>
