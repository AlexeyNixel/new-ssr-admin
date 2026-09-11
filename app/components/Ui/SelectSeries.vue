<script setup lang="ts">
import { useGameApi } from '~~/services/api/game.api';
import type { GameSeries } from '~~/services/types/game.type';

const emit = defineEmits(['update:modelValue']);
const props = defineProps<{
  modelValue: string | undefined;
}>();

const toast = useToast();
const gameApi = useGameApi();

const seriesList = ref<GameSeries[]>([]);
const seriesId = ref(props.modelValue);

seriesList.value = await gameApi.getAllSeries();

const onCreate = async (title: string) => {
  const series = (await gameApi.createSeries({ title })) as GameSeries;
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
