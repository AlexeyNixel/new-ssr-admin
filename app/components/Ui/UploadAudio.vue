<template>
  <div class="flex flex-col gap-3">
    <UFileUpload
      v-slot="{ open }"
      v-model="fileUpload"
      accept="audio/*"
      @update:model-value="uploadAudio"
    >
      <UButton
        :loading="uploading"
        :label="fileName ? 'Заменить аудио' : 'Загрузить аудио'"
        icon="i-lucide-upload"
        color="neutral"
        variant="outline"
        @click="open()"
      />
    </UFileUpload>

    <div
      v-if="fileName"
      class="flex flex-col gap-2"
    >
      <div
        class="flex items-center gap-2 text-sm text-neutral-500 dark:text-neutral-400"
      >
        <Icon
          name="i-heroicons-musical-note-20-solid"
          class="size-4 shrink-0"
        />
        <span class="truncate">{{ fileName }}</span>
      </div>
      <audio
        v-if="url"
        :src="url"
        controls
        preload="none"
        class="h-9 w-full"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useUploadApi } from '~~/services/api/upload.api';

const props = defineProps<{
  modelValue?: string;
  /** path загруженного аудиофайла (для превью) */
  preview?: string;
  /** originalName загруженного аудиофайла */
  previewName?: string;
}>();
const emit = defineEmits(['update:modelValue']);

const uploadApi = useUploadApi();
const toast = useToast();

const fileUpload = ref();
const uploading = ref(false);
const fileName = ref(props.previewName || '');
const url = ref(props.preview ? staticUrl(props.preview) : '');

const uploadAudio = async () => {
  if (!fileUpload.value) return 'Файл не выбран';

  const body = new FormData();
  body.append('file', fileUpload.value);
  fileUpload.value = undefined;

  uploading.value = true;
  try {
    const result = await uploadApi.uploadAudio(body);
    if (result) {
      toast.add({ title: `Аудио «${result.originalName}» загружено` });
      fileName.value = result.originalName;
      url.value = staticUrl(result.path);
      emit('update:modelValue', result.id);
    }
  }
  finally {
    uploading.value = false;
  }
};
</script>

<style scoped></style>
