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
  <UModal
    :title="collection ? 'Редактирование сборника' : 'Создание сборника'"
    :description="
      collection
        ? 'Внесите изменения в сборник'
        : 'Заполните информацию для нового сборника'
    "
    :dismissible="false"
  >
    <template #body>
      <div class="flex flex-col w-full">
        <UForm class="space-y-5" @submit="onSubmit">
          <UFormField label="Название" required>
            <UInput
              v-model="newCollection.label"
              placeholder="Введите название сборника"
              icon="i-heroicons-folder-20-solid"
              size="md"
              class="w-full"
            />
          </UFormField>

          <UFormField label="Изображение">
            <UploadImage
              v-model="newCollection.previewFileId"
              :preview="collection?.preview?.path"
              class="w-full"
            />
            <p class="text-xs text-neutral-500 dark:text-neutral-400">
              Рекомендуемый размер: 600×600px • Форматы: JPG, PNG, WebP
            </p>
          </UFormField>

          <div
            class="flex items-center justify-end gap-3 pt-4 mt-2 border-t border-neutral-200 dark:border-neutral-700"
          >
            <UButton
              type="submit"
              color="primary"
              size="md"
              class="min-w-[120px]"
              :icon="
                collection
                  ? 'i-heroicons-pencil-square-20-solid'
                  : 'i-heroicons-plus-20-solid'
              "
            >
              {{ collection ? 'Обновить' : 'Создать' }}
            </UButton>
          </div>
        </UForm>
      </div>
    </template>
  </UModal>
</template>
