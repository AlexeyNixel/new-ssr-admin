<script setup lang="ts">
/* eslint-disable vue/no-mutating-props */
import type { PageArchiveBlock } from '~~/services/types/page.type';

const props = defineProps<{
  block: PageArchiveBlock;
}>();

const addItem = () => {
  props.block.items.push({ date: '', text: '', url: '' });
};

const removeItem = (index: number) => {
  props.block.items.splice(index, 1);
};
</script>

<template>
  <div class="space-y-4">
    <UFormField label="Заголовок блока" required>
      <UInput v-model="props.block.title" placeholder="Выпуски проекта" class="w-full" />
    </UFormField>
    <UFormField label="Пояснение" description="Необязательно, выводится под заголовком">
      <UInput
        v-model="props.block.note"
        placeholder="Все выпуски проекта по порядку"
        class="w-full"
      />
    </UFormField>
    <UFormField label="Ссылки">
      <div class="space-y-3">
        <div
          v-for="(item, index) in props.block.items"
          :key="index"
          class="p-3 rounded-lg border border-neutral-200 dark:border-neutral-700 space-y-2"
        >
          <div class="flex items-center gap-2">
            <UInput v-model="item.date" placeholder="17.04.2026" class="w-32 shrink-0" />
            <UInput v-model="item.text" placeholder="Текст ссылки" class="flex-1" />
            <UButton
              icon="i-heroicons-x-mark-20-solid"
              color="neutral"
              variant="ghost"
              size="sm"
              @click="removeItem(index)"
            />
          </div>
          <UInput v-model="item.url" placeholder="/post/slug-novosti или https://..." class="w-full" />
        </div>
        <UButton
          icon="i-heroicons-plus-20-solid"
          color="neutral"
          variant="subtle"
          size="sm"
          label="Добавить ссылку"
          @click="addItem"
        />
        <p v-if="!props.block.items.length" class="text-xs text-neutral-500 dark:text-neutral-400">
          Пока нет ни одной ссылки
        </p>
      </div>
    </UFormField>
  </div>
</template>

<style scoped></style>
