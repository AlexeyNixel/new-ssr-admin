<template>
  <USelectMenu
    v-model="collectionsRes"
    :items="collections"
    label-key="label"
    multiple
    value-key="id"
    placeholder="Выберите подборки"
    class="w-full"
    create-item
    @update:model-value="emit('update:modelValue', collectionsRes)"
    @create="onCreate"
  />
</template>

<script setup lang="ts">
import { useBookApi } from '~~/services/api/book.api';
import type { BookCollection } from '~~/services/types/book.type';

const emit = defineEmits(['update:modelValue']);
const props = defineProps<{
  modelValue: string[];
}>();

const bookApi = useBookApi();
const toast = useToast();

const collections = ref();
const collectionsRes = ref(props.modelValue);
// Подборки книги догружаются после открытия формы — подхватываем их
watch(
  () => props.modelValue,
  (value) => {
    collectionsRes.value = value;
  }
);

// isDeleted — вместе со скрытыми: книгу можно заранее положить в готовящуюся подборку
const { data } = await bookApi.getAllCollections({ isDeleted: true, limit: 1000 });

collections.value = data;

// Картинка у подборки необязательна — создаём по одному названию,
// описание и обложки книг настраиваются в редакторе подборки
const onCreate = async (label: string) => {
  try {
    const collection = (await bookApi.createCollection({ label: label.trim() })) as BookCollection;
    collections.value.push(collection);
    collectionsRes.value = [...collectionsRes.value, collection.id];
    emit('update:modelValue', collectionsRes.value);
    toast.add({ title: 'Подборка создана', description: label.trim(), color: 'success' });
  } catch {
    toast.add({ title: 'Не удалось создать подборку', color: 'error' });
  }
};
</script>

<style scoped></style>
