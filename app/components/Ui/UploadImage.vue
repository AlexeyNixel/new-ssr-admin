<template>
  <UFileUpload
    v-slot="{ open }"
    v-model="fileUpload"
    label="Загрузить изображение"
    description="Перетащите или выберите изображение"
    class="h-56 w-full"
    @update:model-value="uploadImage"
  >
    <img
      v-if="preview"
      class="h-56 w-full"
      :src="`http://static.infomania.ru${newPreview.path}`"
      alt=""
      @click="open()"
    />
  </UFileUpload>
</template>

<script setup lang="ts">
import { useUploadApi } from '~~/services/api/upload.api';

interface Props {
  modelValue: string;
  preview?: string;
}

const props = defineProps<Props>();
const emit = defineEmits(['update:modelValue']);

const uploadApi = useUploadApi();

const fileUpload = ref();
const newPreview = ref({
  id: '',
  path: props.preview,
});

const uploadImage = async () => {
  if (fileUpload.value) {
    const body = new FormData();
    body.append('file', fileUpload.value);

    const result = await uploadApi.uploadImage(body);
    emit('update:modelValue', result.id);
    newPreview.value.id = result.id;
    newPreview.value.path = result.path;
  }
};
</script>
