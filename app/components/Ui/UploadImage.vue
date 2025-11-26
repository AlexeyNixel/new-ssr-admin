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
interface Props {
  modelValue: string;
  preview?: string;
}

const props = defineProps<Props>();
const emit = defineEmits(['update:modelValue']);

const fileUpload = ref();
const newPreview = ref({
  id: '',
  path: props.preview,
});

const uploadImage = async () => {
  if (fileUpload.value) {
    const body = new FormData();
    body.append('file', fileUpload.value);

    const res: File = (await $fetch(
      'http://localhost:3333/api/files/upload/image',
      {
        method: 'POST',
        body,
        credentials: 'include',
      }
    )) as File;
    emit('update:modelValue', res.id);
    newPreview.value.id = res.id;
    newPreview.value.path = res.path;
  }
};
</script>
