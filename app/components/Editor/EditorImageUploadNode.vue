<script setup lang="ts">
import type { NodeViewProps } from '@tiptap/vue-3';
import { NodeViewWrapper } from '@tiptap/vue-3';
import { useUploadApi } from '~~/services/api/upload.api';

const props = defineProps<NodeViewProps>();
const uploadApi = useUploadApi();
const file = ref<File | null>(null);
const loading = ref(false);

watch(file, async (newFile) => {
  if (!newFile) return;

  loading.value = true;

  const reader = new FileReader();
  reader.onload = async (e) => {
    const dataUrl = e.target?.result as string;
    if (!dataUrl) {
      loading.value = false;
      return;
    }

    const body = new FormData();
    body.append('file', newFile);

    // Simulate upload delay
    const res = await uploadApi.uploadImage(body);

    console.log(res);

    const pos = props.getPos();
    if (typeof pos !== 'number') {
      loading.value = false;
      return;
    }

    props.editor
      .chain()
      .focus()
      .deleteRange({ from: pos, to: pos + 1 })
      .setImage({ src: res.path })
      .run();

    loading.value = false;
  };
  reader.readAsDataURL(newFile);
});
</script>

<template>
  <NodeViewWrapper>
    <UFileUpload
      v-model="file"
      accept="image/*"
      label="Загрузить изображение"
      description="PNG, JPG  (макс. 2MB)"
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
