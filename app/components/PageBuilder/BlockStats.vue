<script setup lang="ts">
import type { PageStatsBlock } from '~~/services/types/page.type';

const props = defineProps<{
  block: PageStatsBlock;
}>();

const addItem = () => {
  props.block.items.push({ value: '', label: '' });
};

const removeItem = (index: number) => {
  props.block.items.splice(index, 1);
};
</script>

<template>
  <div class="space-y-3">
    <div v-for="(item, index) in props.block.items" :key="index" class="flex items-start gap-2">
      <UInput v-model="item.value" placeholder="10 000+" class="w-32 shrink-0" />
      <UInput v-model="item.label" placeholder="грампластинок" class="w-full" />
      <UButton
        icon="i-heroicons-x-mark-20-solid"
        color="neutral"
        variant="ghost"
        size="sm"
        @click="removeItem(index)"
      />
    </div>
    <UButton
      icon="i-heroicons-plus-20-solid"
      color="neutral"
      variant="subtle"
      size="sm"
      label="Добавить пункт"
      @click="addItem"
    />
    <p v-if="!props.block.items.length" class="text-xs text-neutral-500 dark:text-neutral-400">
      Пока нет ни одного пункта статистики
    </p>
  </div>
</template>

<style scoped></style>
