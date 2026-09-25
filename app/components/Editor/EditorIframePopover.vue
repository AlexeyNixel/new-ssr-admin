<script setup lang="ts">
import type { Editor } from '@tiptap/vue-3';
import {
  IFRAME_DEFAULT_HEIGHT,
  IFRAME_DEFAULT_WIDTH,
  parseIframeInput,
} from '~/components/Editor/iframe';

const props = defineProps<{
  editor: Editor;
}>();

const open = ref(false);
const code = ref('');
const width = ref(IFRAME_DEFAULT_WIDTH);
const height = ref(IFRAME_DEFAULT_HEIGHT);
const error = ref('');

const active = computed(() => props.editor.isActive('iframe'));

// При открытии: если выделен iframe — редактируем его, иначе форма для нового
watch(open, (isOpen) => {
  if (!isOpen) return;
  error.value = '';
  if (active.value) {
    const attrs = props.editor.getAttributes('iframe');
    code.value = attrs.src || '';
    width.value = attrs.width || IFRAME_DEFAULT_WIDTH;
    height.value = attrs.height || IFRAME_DEFAULT_HEIGHT;
  } else {
    code.value = '';
    width.value = IFRAME_DEFAULT_WIDTH;
    height.value = IFRAME_DEFAULT_HEIGHT;
  }
});

// Если вставили код целиком — подставляем размеры из него
watch(code, (value) => {
  if (!value.trim().startsWith('<')) return;
  const parsed = parseIframeInput(value);
  if (parsed?.width) width.value = parsed.width;
  if (parsed?.height) height.value = parsed.height;
});

function apply() {
  const parsed = parseIframeInput(code.value);
  if (!parsed) {
    error.value = 'Вставьте ссылку (http/https) или код iframe';
    return;
  }

  // title/allow сбрасываем явно, чтобы при замене не остались от прежнего iframe
  const attrs = {
    title: null,
    allow: null,
    ...parsed,
    width: width.value.trim() || IFRAME_DEFAULT_WIDTH,
    height: height.value.trim() || IFRAME_DEFAULT_HEIGHT,
  };

  const chain = props.editor.chain().focus();
  const ok = active.value ? chain.updateIframe(attrs).run() : chain.setIframe(attrs).run();

  if (!ok) {
    error.value = 'Не удалось вставить iframe в это место';
    return;
  }
  open.value = false;
}

function remove() {
  props.editor.chain().focus().deleteSelection().run();
  open.value = false;
}
</script>

<template>
  <UPopover v-model:open="open">
    <UTooltip :text="active ? 'Изменить iframe' : 'Вставить iframe'">
      <UButton
        icon="i-lucide-monitor-play"
        color="neutral"
        active-color="primary"
        variant="ghost"
        active-variant="soft"
        size="sm"
        :active="active"
        :disabled="!editor.isEditable"
      />
    </UTooltip>

    <template #content>
      <form class="flex w-96 flex-col gap-3 p-3" @submit.prevent="apply">
        <UFormField
          label="Ссылка или код iframe"
          help="YouTube, Rutube, VK Видео, Яндекс.Карты и т.п."
          :error="error || undefined"
        >
          <UTextarea
            v-model="code"
            autofocus
            :rows="3"
            autoresize
            class="w-full"
            placeholder="https://… или <iframe src=&quot;…&quot;></iframe>"
            @update:model-value="error = ''"
          />
        </UFormField>

        <div class="grid grid-cols-2 gap-3">
          <UFormField label="Ширина" help="px или %">
            <UInput v-model="width" class="w-full" placeholder="100%" />
          </UFormField>
          <UFormField label="Высота" help="px">
            <UInput v-model="height" class="w-full" placeholder="450" />
          </UFormField>
        </div>

        <div class="flex justify-end gap-2">
          <UButton
            v-if="active"
            icon="i-lucide-trash"
            color="error"
            variant="ghost"
            size="sm"
            label="Удалить"
            @click="remove"
          />
          <UButton
            type="submit"
            size="sm"
            :label="active ? 'Сохранить' : 'Вставить'"
            :disabled="!code.trim()"
          />
        </div>
      </form>
    </template>
  </UPopover>
</template>
