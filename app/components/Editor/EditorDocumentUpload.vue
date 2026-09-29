<script setup lang="ts">
import type { Editor } from '@tiptap/vue-3';
import { useUploadApi } from '~~/services/api/upload.api';

/*
 * Загружает документ и вставляет ссылку на него в текст.
 * Если текст выделен — ссылкой становится выделение, иначе вставляется
 * имя файла. Ссылка относительная (/site/document/...), как и в уже
 * существующем контенте, куда её раньше вставляли вручную.
 */
const props = defineProps<{
  editor: Editor;
}>();

const uploadApi = useUploadApi();
const toast = useToast();

const input = ref<HTMLInputElement>();
const loading = ref(false);

const ACCEPT = '.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.odt,.ods,.rtf,.txt,.zip,.rar';

const onChange = async (event: Event) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  target.value = '';
  if (!file) return;

  loading.value = true;
  try {
    const body = new FormData();
    body.append('file', file);
    const result = await uploadApi.uploadDocument(body);

    const { empty } = props.editor.state.selection;
    const chain = props.editor.chain().focus();
    if (empty) {
      chain
        .insertContent([
          {
            type: 'text',
            text: result.originalName || file.name,
            marks: [{ type: 'link', attrs: { href: result.path } }],
          },
          { type: 'text', text: ' ' },
        ])
        .run();
    } else {
      chain.extendMarkRange('link').setLink({ href: result.path }).run();
    }

    toast.add({ title: `Документ «${result.originalName || file.name}» прикреплён`, color: 'success' });
  } catch {
    toast.add({ title: 'Не удалось загрузить документ', color: 'error' });
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <UTooltip text="Прикрепить документ (PDF, DOCX…)">
    <UButton
      :icon="loading ? 'i-lucide-loader-circle' : 'i-lucide-paperclip'"
      color="neutral"
      variant="ghost"
      size="sm"
      :disabled="loading || !editor.isEditable"
      :ui="{ leadingIcon: loading ? 'animate-spin' : '' }"
      aria-label="Прикрепить документ"
      @click="input?.click()"
    />
  </UTooltip>
  <input
    ref="input"
    type="file"
    class="hidden"
    :accept="ACCEPT"
    @change="onChange"
  >
</template>
