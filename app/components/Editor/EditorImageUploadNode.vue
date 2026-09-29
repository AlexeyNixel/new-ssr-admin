<script setup lang="ts">
import type { NodeViewProps } from '@tiptap/vue-3';
import { NodeViewWrapper } from '@tiptap/vue-3';
import { useUploadApi } from '~~/services/api/upload.api';

const props = defineProps<NodeViewProps>();
const uploadApi = useUploadApi();
const toast = useToast();
const file = ref<File | null>(null);
const loading = ref(false);

watch(file, async (newFile) => {
  if (!newFile) return;

  loading.value = true;
  try {
    const body = new FormData();
    body.append('file', newFile);
    const res = await uploadApi.uploadImage(body);

    const pos = props.getPos();
    if (typeof pos !== 'number') return;

    props.editor
      .chain()
      .focus()
      .deleteRange({ from: pos, to: pos + 1 })
      .setImage({ src: `http://static.infomania.ru${res.path}` })
      .run();
  } catch {
    toast.add({ title: 'Не удалось загрузить изображение', color: 'error' });
    file.value = null;
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <NodeViewWrapper>
    <UFileUpload
      v-model="file"
      accept="image/*"
      label="Загрузить изображение"
      description="PNG, JPG, WEBP (макс. 2 МБ)"
      :preview="false"
      class="min-h-48"
    >
      <template #leading>
        <UAvatar
          :icon="loading ? 'i-lucide-loader-circle' : 'i-lucide-image'"
          size="xl"
          :ui="{ icon: [loading && 'animate-spin'] }"
        />
      </template>
    </UFileUpload>
  </NodeViewWrapper>
</template>
