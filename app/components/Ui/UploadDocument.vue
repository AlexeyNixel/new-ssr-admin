<template>
  <div class="flex flex-col gap-3">
    <UFileUpload
      v-slot="{ open }"
      v-model="document"
      @update:model-value="uploadDocument"
    >
      <UButton label="Загрузить документ" @click="open()" />
    </UFileUpload>

    <UInput v-if="url" v-model="url" :ui="{ trailing: 'pr-0.5' }">
      <template v-if="url?.length" #trailing>
        <UTooltip text="Скопировать ссылку" :content="{ side: 'right' }">
          <UButton
            :color="copied ? 'success' : 'neutral'"
            size="sm"
            :icon="copied ? 'i-lucide-copy-check' : 'i-lucide-copy'"
            aria-label="Скопировать ссылку"
            @click="copy(url)"
          />
        </UTooltip>
      </template>
    </UInput>
  </div>
</template>

<script setup lang="ts">
import { useUploadApi } from '~~/services/api/upload.api';
import { useClipboard } from '@vueuse/core';

const { copy, copied } = useClipboard();

const document = ref();
const toast = useToast();
const url = ref('');

const uploadApi = useUploadApi();

const uploadDocument = async () => {
  if (!document.value) return 'Документ не выбран';

  const body = new FormData();
  body.append('file', document.value);
  document.value = undefined;

  const result = await uploadApi.uploadDocument(body);

  if (result) {
    toast.add({
      title: `Документ ${result.originalName} Загружен`,
    });

    url.value = result.path;
  }
};
</script>

<style scoped></style>
