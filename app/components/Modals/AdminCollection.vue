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

const { entity: collection, pending, notFound } = useModalEntity({
  prop: props.collection,
  fetchById: (id) => bookApi.getOneCollection(id),
});
const isUpdate = computed(() => !!collection.value);

const newCollection = ref({
  previewFileId: '',
  label: '',
});

watch(
  collection,
  (value) => {
    if (!value) return;
    newCollection.value = {
      previewFileId: value.previewFileId || '',
      label: value.label || '',
    };
  },
  { immediate: true }
);

const onSubmit = async () => {
  if (isUpdate.value && collection.value) {
    await bookApi.updateCollection(collection.value.id, {
      ...newCollection.value,
    });
    toast.add({ title: 'Сборник обновлён' });
  } else {
    await bookApi.createCollection({ ...newCollection.value });
    toast.add({ title: 'Сборник создан' });
  }

  emit('close', true);
};
</script>

<template>
  <UModal
    :title="isUpdate ? 'Редактирование сборника' : 'Создание сборника'"
    :description="
      isUpdate
        ? 'Внесите изменения в сборник'
        : 'Заполните информацию для нового сборника'
    "
    :dismissible="false"
  >
    <template #body>
      <div v-if="pending" class="flex items-center justify-center py-12">
        <UIcon
          name="i-heroicons-arrow-path"
          class="w-6 h-6 animate-spin text-neutral-400"
        />
      </div>

      <div
        v-else-if="notFound"
        class="py-12 text-center text-neutral-500 dark:text-neutral-400"
      >
        Запись не найдена
      </div>

      <div v-else class="flex flex-col w-full">
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
                isUpdate
                  ? 'i-heroicons-pencil-square-20-solid'
                  : 'i-heroicons-plus-20-solid'
              "
            >
              {{ isUpdate ? 'Обновить' : 'Создать' }}
            </UButton>
          </div>
        </UForm>
      </div>
    </template>
  </UModal>
</template>
