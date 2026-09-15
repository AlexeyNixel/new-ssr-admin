<script setup lang="ts">
import { useComicApi } from '~~/services/api/comic.api';
import type { ComicGenre } from '~~/services/types/comic.type';

const emit = defineEmits(['update:modelValue']);
const props = defineProps<{
  modelValue: string[];
}>();

const toast = useToast();
const comicApi = useComicApi();

const genres = ref<ComicGenre[]>([]);
const genreIds = ref(props.modelValue);

genres.value = await comicApi.getAllGenres();

const onCreate = async (title: string) => {
  const tag = title
    .toLowerCase()
    .trim()
    .replace(/[^a-zа-яё0-9]+/gi, '_');

  const genre = (await comicApi.createGenre({ tag, title })) as ComicGenre;
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
