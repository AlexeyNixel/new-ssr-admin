<template>
  <div class="flex flex-wrap gap-3">
    <div
      v-for="(image, index) in images"
      :key="image.id"
      class="relative h-32 w-32 shrink-0 overflow-hidden rounded-lg border border-neutral-200 dark:border-neutral-700"
    >
      <img
        v-if="image.path"
        :src="`http://static.infomania.ru${image.path}`"
        class="h-full w-full object-cover"
        alt=""
      >
      <UButton
        icon="i-heroicons-x-mark"
        color="error"
        variant="solid"
        size="xs"
        class="absolute right-1 top-1 rounded-full"
        @click="removeImage(index)"
      />
    </div>

    <UFileUpload
      v-if="images.length < 3"
      v-slot="{ open }"
      v-model="fileUpload"
      class="h-32 w-32 shrink-0"
      @update:model-value="uploadImage"
    >
      <button
        type="button"
        class="flex h-32 w-32 flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-neutral-300 text-neutral-400 hover:border-primary-400 hover:text-primary-500 dark:border-neutral-700"
        @click="open()"
      >
        <UIcon name="i-heroicons-plus" class="h-6 w-6" />
        <span class="text-xs">Добавить</span>
      </button>
    </UFileUpload>
  </div>
</template>

<script setup lang="ts">
import { useUploadApi } from '~~/services/api/upload.api';

interface ImageItem {
  id: string;
  path?: string;
}

const props = defineProps<{
  modelValue: string[];
  /** Уже загруженные картинки в режиме редактирования — {id, path}. */
  previews?: ImageItem[];
}>();
const emit = defineEmits(['update:modelValue']);

const uploadApi = useUploadApi();
const toast = useToast();

const images = ref<ImageItem[]>(
  props.modelValue.map(
    (id) => props.previews?.find((p) => p.id === id) ?? { id }
  )
);

const fileUpload = ref();

const emitIds = () => {
  emit(
    'update:modelValue',
    images.value.map((image) => image.id)
  );
};

const uploadImage = async () => {
  if (!fileUpload.value) return;

  const body = new FormData();
  body.append('file', fileUpload.value);
  fileUpload.value = undefined;

  const result = await uploadApi.uploadImage(body);
  images.value.push({ id: result.id, path: result.path });
  emitIds();
};

const removeImage = (index: number) => {
  images.value.splice(index, 1);
  emitIds();
  toast.add({ title: 'Изображение удалено из списка' });
};
</script>
