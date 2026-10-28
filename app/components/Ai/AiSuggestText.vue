<script setup lang="ts">
import { computed, ref } from 'vue';
import type { AiModeId } from '~~/services/ai/prompts';
import { useAiFormat } from '~/composables/useAiFormat';

const props = withDefaults(
  defineProps<{
    /** Исходный текст, из которого делаем краткое описание (уже без HTML). */
    source: string;
    /** Режим генерации; по умолчанию — краткое описание в 2–3 предложения. */
    mode?: AiModeId;
    /** Подпись кнопки. */
    label?: string;
    /** Минимальная длина исходного текста, чтобы было что сжимать. */
    minLength?: number;
  }>(),
  { mode: 'announce', label: 'Предложить', minLength: 40 }
);

const emit = defineEmits<{ apply: [text: string] }>();

const open = ref(false);
const { result, loading, error, run, abort } = useAiFormat();
const toast = useToast();

const enabled = computed(() => props.source.trim().length >= props.minLength);

const cleaned = computed(() =>
  result.value
    .replace(/<think>[\s\S]*?<\/think>/gi, '')
    .replace(/^```(?:\w+)?\s*/i, '')
    .replace(/\s*```\s*$/i, '')
    .trim()
);

const start = () => {
  if (!enabled.value) {
    toast.add({ title: 'Сначала напишите текст — из него сформируем описание', color: 'warning' });
    return;
  }
  run(props.mode, props.source);
};

const onToggle = (v: boolean) => {
  if (v) start();
  else abort();
};

const apply = () => {
  if (!cleaned.value) return;
  emit('apply', cleaned.value);
  open.value = false;
  toast.add({ title: 'Описание подставлено', color: 'success', icon: 'i-lucide-check' });
};
</script>

<template>
  <UPopover v-model:open="open" :content="{ align: 'end' }" @update:open="onToggle">
    <UButton
      icon="i-lucide-sparkles"
      color="primary"
      variant="ghost"
      size="xs"
      :disabled="!enabled"
    >
      {{ label }}
    </UButton>

    <template #content>
      <div class="w-80 max-w-[90vw] p-3">
        <div class="mb-2 flex items-center gap-1.5 text-xs font-medium text-muted">
          <UIcon name="i-lucide-sparkles" class="size-3.5" />
          Предложение ИИ
        </div>

        <div
          class="min-h-20 max-h-60 overflow-auto rounded-md border border-default bg-elevated/40 p-2.5 text-sm leading-relaxed"
        >
          <span v-if="error" class="text-error">{{ error }}</span>
          <span v-else-if="loading && !cleaned" class="flex items-center gap-2 text-muted">
            <UIcon name="i-lucide-loader-circle" class="size-4 animate-spin" /> Модель думает…
          </span>
          <template v-else>
            <span class="whitespace-pre-wrap">{{ cleaned }}</span>
            <UIcon
              v-if="loading"
              name="i-lucide-loader-circle"
              class="ml-1 inline size-3 animate-spin align-middle text-muted"
            />
          </template>
        </div>

        <div class="mt-2.5 flex items-center justify-between gap-2">
          <UButton
            icon="i-lucide-rotate-ccw"
            color="neutral"
            variant="ghost"
            size="xs"
            :loading="loading"
            :disabled="loading"
            @click="start"
          >
            Заново
          </UButton>
          <UButton
            icon="i-lucide-check"
            color="primary"
            size="xs"
            :disabled="!cleaned || loading"
            @click="apply"
          >
            Вставить
          </UButton>
        </div>
      </div>
    </template>
  </UPopover>
</template>
