<template>
  <USelectMenu
    v-model="collectionsRes"
    :items="collections"
    label-key="label"
    multiple
    value-key="id"
    placeholder="Выберите коллекции"
    class="w-full"
    create-item
    @update:model-value="emit('update:modelValue', collectionsRes)"
    @create="onCreate"
  />
</template>

<script setup lang="ts">
import { useBookApi } from '~~/services/api/book.api';
import type { BookCollection } from '~~/services/types/book.type';
import type { File as ApiFile } from '~~/services/types/file.type';

const emit = defineEmits(['update:modelValue']);
const props = defineProps<{
  modelValue: string[];
}>();

const bookApi = useBookApi();
const toast = useToast();

const collections = ref();
const collectionsRes = ref(props.modelValue);

const { data } = await bookApi.getAllCollections();

collections.value = data;

const onCreate = async (label: string) => {
  const input = document.createElement('input');
  input.type = 'file';

  input.onchange = async (e: Event) => {
    const image = (e.target as HTMLInputElement).files?.[0];
    if (!image) return;

    const body = new FormData();
    body.append('file', image);

    const result = (await $fetch('http://localhost:3333/api/files/upload/image', {
      method: 'POST',
      body,
      credentials: 'include',
    })) as ApiFile;

    if (result) {
      const collection = (await bookApi.createCollection({
        label: label,
        previewFileId: result.id,
      })) as BookCollection;

      collectionsRes.value.push(collection.id);
      collections.value.push(collection);
      toast.add({
        title: 'Коллекция создана',
      });
    }
  };

  input.click();
};
</script>

<style scoped></style>
