<template>
  <UFileUpload
    v-slot="{ open }"
    v-model="exhibition"
    variant="button"
    @update:model-value="handleUploadExhibition"
  >
    <UButton
      icon="material-symbols:upload"
      color="neutral"
      class="flex items-center cursor-pointer gap-3 p-3 rounded-lg transition-colors duration-200 group hover:bg-gray-800 hover:text-white"
      @click="open()"
    >
      Загрузить выставку
    </UButton>
  </UFileUpload>
</template>

<script setup lang="ts">
import { useUploadApi } from '~~/services/api/upload.api';

const toast = useToast();
const exhibition = ref();

const uploadApi = useUploadApi();

const handleUploadExhibition = async () => {
  if (!exhibition.value) return 'Файл не выбран';

  const body = new FormData();

  body.append('file', exhibition.value);
  exhibition.value = undefined;

  const result = await uploadApi.uploadExhibition(body);

  if (result) {
    toast.add({
      title: `Выставка ${result.originalName} загружена`,
    });
  }
};
</script>

<style scoped></style>
