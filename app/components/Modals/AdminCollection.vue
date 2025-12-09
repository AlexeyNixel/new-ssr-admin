<script setup lang="ts">
import UploadImage from '~/components/Ui/UploadImage.vue';
import type { BookCollection } from '~~/services/types/book.type';
import { useBookApi } from '~~/services/api/book.api';

const toast = useToast();
const bookApi = useBookApi();
const props = defineProps<{
  collection?: BookCollection;
}>();
const emit = defineEmits<{ close: [boolean] }>();

const newCollection = ref({
  previewFileId: props?.collection?.previewFileId || '',
  label: props?.collection?.label || '',
});

const onSubmit = async () => {
  if (props.collection) {
    await bookApi.updateCollection(props?.collection?.id, {
      ...newCollection.value,
    });
  } else {
    await bookApi.createCollection({ ...newCollection.value });
  }

  toast.add({ title: 'Запись обновлена' });

  closeModal();
};

const closeModal = () => {
  emit('close', true);
};
</script>

<template>
  <UModal title="Админка сборников" description="нет">
    <template #content>
      <UForm class="flex flex-col gap-5 p-5" @submit="onSubmit">
        <h1>
          {{ collection ? 'Обновление записи' : 'Создание записи' }}
        </h1>
        <UFormField label="Название">
          <UInput
            v-model="newCollection.label"
            placeholder="Введите название"
            class="w-full"
          />
        </UFormField>
        <UFormField label="Изображение">
          <UploadImage
            v-model="newCollection.previewFileId"
            :preview="collection?.preview?.path"
          />
        </UFormField>

        <div class="flex justify-end gap-5">
          <UButton color="neutral" @click="closeModal">Отмена</UButton>
          <UButton color="secondary" type="submit">
            {{ collection ? 'Обновить' : 'Создать' }}
          </UButton>
        </div>
      </UForm>
    </template>
  </UModal>
</template>

<style scoped></style>
