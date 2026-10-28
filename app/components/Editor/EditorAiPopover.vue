<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import type { Editor } from '@tiptap/vue-3';
import { useClipboard } from '@vueuse/core';
import { AI_MODE_LIST, AI_MODES, type AiMode, type AiModeId } from '~~/services/ai/prompts';
import { useAiFormat } from '~/composables/useAiFormat';

const props = defineProps<{ editor: Editor }>();

const open = ref(false);
const mode = ref<AiModeId>('format');
const { result, loading, error, run, abort } = useAiFormat();
const toast = useToast();
const clipboard = useClipboard();

/** Что обрабатываем: выделение (если есть) или весь текст новости. */
const scope = ref<{ kind: 'selection' | 'document'; from: number; to: number }>({
  kind: 'document',
  from: 0,
  to: 0,
});

const activeMode = computed<AiMode>(() => AI_MODES[mode.value]);

const hasText = computed(() => props.editor.getText().trim().length > 0);

/** Убираем артефакты маленькой модели: markdown-ограждения и блоки <think>. */
const cleaned = computed(() =>
  result.value
    .replace(/<think>[\s\S]*?<\/think>/gi, '')
    .replace(/^```(?:html)?\s*/i, '')
    .replace(/\s*```\s*$/i, '')
    .trim()
);

const captureSource = (): string => {
  const { state } = props.editor;
  const { from, to, empty } = state.selection;
  if (!empty) {
    scope.value = { kind: 'selection', from, to };
    return state.doc.textBetween(from, to, '\n\n', '\n');
  }
  scope.value = { kind: 'document', from: 0, to: 0 };
  return props.editor.getText();
};

const start = async () => {
  const text = captureSource();
  if (!text.trim()) {
    toast.add({ title: 'Нет текста для обработки', color: 'warning' });
    return;
  }
  await run(mode.value, text);
};

// Смена режима при открытой модалке — сразу перезапускаем.
watch(mode, () => {
  if (open.value) start();
});

// При открытии запускаем обработку, при закрытии — обрываем запрос.
watch(open, (v) => {
  if (v) start();
  else abort();
});

const applyToEditor = () => {
  const html = cleaned.value;
  if (!html) return;
  const chain = props.editor.chain().focus();
  if (scope.value.kind === 'selection') {
    chain.deleteRange({ from: scope.value.from, to: scope.value.to }).insertContentAt(scope.value.from, html).run();
  } else {
    chain.setContent(html).run();
  }
  toast.add({ title: 'Текст обновлён', color: 'success', icon: 'i-lucide-check' });
  open.value = false;
};

const copyResult = async () => {
  await clipboard.copy(cleaned.value);
  toast.add({ title: 'Скопировано', color: 'success', icon: 'i-lucide-copy' });
};

const scopeLabel = computed(() =>
  scope.value.kind === 'selection' ? 'выделенный фрагмент' : 'весь текст новости'
);
</script>

<template>
  <UModal
    v-model:open="open"
    title="ИИ-помощник"
    :description="`Обрабатывается ${scopeLabel}`"
    :ui="{ content: 'sm:max-w-2xl' }"
  >
    <UTooltip text="Обработать текст с помощью ИИ">
      <UButton
        icon="i-lucide-sparkles"
        color="primary"
        variant="ghost"
        size="sm"
        :disabled="!hasText"
      />
    </UTooltip>

    <template #body>
      <div class="space-y-4">
        <!-- Режимы -->
        <div class="flex flex-wrap gap-2">
          <UButton
            v-for="m in AI_MODE_LIST"
            :key="m.id"
            :icon="m.icon"
            :color="mode === m.id ? 'primary' : 'neutral'"
            :variant="mode === m.id ? 'solid' : 'outline'"
            size="sm"
            @click="mode = m.id"
          >
            {{ m.label }}
          </UButton>
        </div>
        <p class="text-xs text-muted">{{ activeMode.description }}</p>

        <!-- Результат -->
        <div
          class="min-h-40 max-h-[50vh] overflow-auto rounded-lg border border-default bg-elevated/40 p-4 text-sm leading-relaxed"
        >
          <div v-if="error" class="flex items-start gap-2 text-error">
            <UIcon name="i-lucide-triangle-alert" class="mt-0.5 size-4 shrink-0" />
            <span>{{ error }}</span>
          </div>

          <div
            v-else-if="loading && !result"
            class="flex items-center gap-2 text-muted"
          >
            <UIcon name="i-lucide-loader-circle" class="size-4 animate-spin" />
            Модель думает…
          </div>

          <template v-else>
            <!-- html-режимы показываем как разметку, анонс — как обычный текст -->
            <div
              v-if="activeMode.output === 'html'"
              class="prose prose-sm max-w-none dark:prose-invert"
              v-html="cleaned || '<span class=\'text-muted\'>…</span>'"
            />
            <p v-else class="whitespace-pre-wrap">{{ cleaned }}</p>
            <UIcon
              v-if="loading"
              name="i-lucide-loader-circle"
              class="ml-1 inline size-3.5 animate-spin align-middle text-muted"
            />
          </template>
        </div>
      </div>
    </template>

    <template #footer>
      <div class="flex w-full items-center justify-between gap-2">
        <UButton
          icon="i-lucide-rotate-ccw"
          color="neutral"
          variant="ghost"
          size="sm"
          :loading="loading"
          :disabled="loading"
          @click="start"
        >
          Заново
        </UButton>

        <div class="flex items-center gap-2">
          <UButton
            icon="i-lucide-copy"
            color="neutral"
            variant="outline"
            size="sm"
            :disabled="!cleaned || loading"
            @click="copyResult"
          >
            Копировать
          </UButton>
          <UButton
            v-if="activeMode.output === 'html'"
            icon="i-lucide-check"
            color="primary"
            size="sm"
            :disabled="!cleaned || loading"
            @click="applyToEditor"
          >
            Заменить текст
          </UButton>
        </div>
      </div>
    </template>
  </UModal>
</template>
