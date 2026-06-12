<script setup lang="ts">
import type { PageFeaturesBlock } from '~~/services/types/page.type';

const props = defineProps<{
  block: PageFeaturesBlock;
}>();

const addItem = () => {
  props.block.items.push({ icon: '', title: '', description: '' });
};

const removeItem = (index: number) => {
  props.block.items.splice(index, 1);
};
</script>

<template>
  <div class="space-y-3">
    <div
      v-for="(item, index) in props.block.items"
      :key="index"
      class="p-3 rounded-lg border border-neutral-200 dark:border-neutral-700 space-y-2"
    >
      <div class="flex items-center gap-2">
        <div
          class="p-2 bg-neutral-50 dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 shrink-0"
        >
          <UIcon
            :name="item.icon || 'i-heroicons-question-mark-circle-20-solid'"
            class="text-lg text-neutral-600 dark:text-neutral-300"
          />
        </div>
        <UInput v-model="item.icon" placeholder="i-heroicons-film" class="flex-1" />
        <UButton
          icon="i-heroicons-x-mark-20-solid"
          color="neutral"
          variant="ghost"
          size="sm"
          @click="removeItem(index)"
        />
      </div>
      <UInput v-model="item.title" placeholder="Заголовок направления" class="w-full" />
      <UTextarea
        v-model="item.description"
        :rows="2"
        placeholder="Описание направления"
        class="w-full"
      />
    </div>
    <UButton
      icon="i-heroicons-plus-20-solid"
      color="neutral"
      variant="subtle"
      size="sm"
      label="Добавить направление"
      @click="addItem"
    />
    <p v-if="!props.block.items.length" class="text-xs text-neutral-500 dark:text-neutral-400">
      Пока нет ни одного направления
    </p>
  </div>
</template>

<style scoped></style>
