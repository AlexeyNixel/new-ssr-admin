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
  let result: File;
  const input = document.createElement('input');
  input.type = 'file';

  input.onchange = async (e: any) => {
    const image = e.target.files[0];
    const body = new FormData();

    body.append('file', image);
    result = (await $fetch('http://localhost:3333/api/files/upload/image', {
      method: 'POST',
      body,
      credentials: 'include',
    })) as File;

    if (result) {
      const collection = await bookApi.createCollection({
        label: label,
        previewFileId: result.id,
      });

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
