<script setup lang="ts">
import { useGameApi } from '~~/services/api/game.api';
import type { GameGenre } from '~~/services/types/game.type';

const emit = defineEmits(['update:modelValue']);
const props = defineProps<{
  modelValue: string[];
}>();

const toast = useToast();
const gameApi = useGameApi();

const genres = ref<GameGenre[]>([]);
const genreIds = ref(props.modelValue);

genres.value = await gameApi.getAllGenres();

const onCreate = async (title: string) => {
  const tag = title
    .toLowerCase()
    .trim()
    .replace(/[^a-zа-яё0-9]+/gi, '_');

  const genre = (await gameApi.createGenre({ tag, title })) as GameGenre;
  toast.add({ title: 'Жанр добавлен' });
  genreIds.value.push(genre.id);
  genres.value.push(genre);
};
</script>

<template>
  <USelectMenu
    v-model="genreIds"
    :items="genres"
    multiple
    label-key="title"
    value-key="id"
    placeholder="Выбрать жанры"
    class="w-full"
    create-item
    @update:model-value="emit('update:modelValue', genreIds)"
    @create="onCreate"
  />
</template>

<style scoped></style>
