<script setup lang="ts">
import type { PageBlock } from '~~/services/types/page.type';
import { getPageBlockMeta, getPageBlockSummary } from '~/constants/pageBlocks';
import { parsePageBlocksCode } from '~/utils/pageBlockCode';

const props = defineProps<{
  hasHero: boolean;
}>();

const emit = defineEmits<{
  add: [blocks: PageBlock[]];
  cancel: [];
}>();

const code = ref('');

const parsed = computed<{ blocks: PageBlock[]; error?: string }>(() => {
  try {
    const blocks = parsePageBlocksCode(code.value);
    const heroCount = blocks.filter((block) => block.type === 'hero').length;

    if (heroCount > 1)
      return { blocks, error: 'Шапка (Hero) может быть только одна' };
    if (heroCount && props.hasHero) {
      return {
        blocks,
        error:
          'На странице уже есть шапка (Hero) — удалите её или уберите из кода',
      };
    }

    return { blocks };
  } catch (error) {
    return { blocks: [], error: (error as Error).message };
  }
});

const canAdd = computed(
  () => parsed.value.blocks.length > 0 && !parsed.value.error
);

const submit = () => {
  if (!canAdd.value) return;
  emit('add', parsed.value.blocks);
  code.value = '';
};

const placeholder = `{
  "type": "banner",
  "text": "Приходите к нам!"
}

или массив блоков: [ {...}, {...} ]`;
</script>

<template>
  <div
    class="rounded-xl border border-dashed border-neutral-300 dark:border-neutral-700 p-4 space-y-3"
  >
    <UFormField
      label="Код блоков"
      description="JSON одного блока, массива блоков или объекта страницы с полем blocks"
    >
      <UTextarea
        v-model="code"
        :placeholder="placeholder"
        :rows="10"
        autoresize
        :maxrows="24"
        class="w-full"
        :ui="{ base: 'font-mono text-xs' }"
        @keydown.ctrl.enter.prevent="submit"
        @keydown.meta.enter.prevent="submit"
      />
    </UFormField>

    <UAlert
      v-if="code.trim() && parsed.error"
      color="error"
      variant="subtle"
      icon="i-heroicons-exclamation-triangle"
      :description="parsed.error"
    />

    <div v-if="parsed.blocks.length && !parsed.error" class="space-y-1.5">
      <p class="text-xs text-muted">Будет добавлено:</p>
      <div
        v-for="(block, index) in parsed.blocks"
        :key="index"
        class="flex items-center gap-2 rounded-lg bg-neutral-50 dark:bg-neutral-800/50 px-3 py-2"
      >
        <UIcon
          :name="getPageBlockMeta(block.type).icon"
          class="w-4 h-4 text-primary shrink-0"
        />
        <span class="text-sm font-medium shrink-0">{{
          getPageBlockMeta(block.type).label
        }}</span>
        <span
          v-if="getPageBlockSummary(block)"
          class="text-xs text-muted truncate"
        >
          — {{ getPageBlockSummary(block) }}
        </span>
      </div>
    </div>

    <div class="flex items-center gap-2">
      <UButton
        icon="i-heroicons-plus-20-solid"
        :label="
          parsed.blocks.length > 1
            ? `Добавить блоки (${parsed.blocks.length})`
            : 'Добавить'
        "
        :disabled="!canAdd"
        @click="submit"
      />
      <UButton
        color="neutral"
        variant="ghost"
        label="Отмена"
        @click="emit('cancel')"
      />
    </div>
  </div>
</template>

<style scoped></style>
