<script setup lang="ts">
/* eslint-disable vue/no-mutating-props */
import type { PageTagsBlock, PageTagsBlockLinkItem } from '~~/services/types/page.type';

const props = defineProps<{
  block: PageTagsBlock;
}>();

// Старые теги хранятся строками — приводим к { text, url }, чтобы у каждого можно было задать ссылку
props.block.items = props.block.items.map((item) =>
  typeof item === 'string' ? { text: item, url: '' } : { text: item.text, url: item.url ?? '' }
);

const items = computed(() => props.block.items as PageTagsBlockLinkItem[]);

const addItem = () => {
  props.block.items.push({ text: '', url: '' });
};

const removeItem = (index: number) => {
  props.block.items.splice(index, 1);
};
</script>

<template>
  <div class="space-y-4">
    <UFormField label="Заголовок блока" description="Необязательно">
      <UInput
        v-model="props.block.title"
        placeholder="Коллекции фильмов в сериях:"
        class="w-full"
      />
    </UFormField>
    <UFormField label="Теги" description="Если указать ссылку, тег станет кликабельным">
      <div class="space-y-2">
        <div v-for="(item, index) in items" :key="index" class="flex items-center gap-2">
          <UInput v-model="item.text" placeholder="Например: драма" class="w-full" />
          <UInput
            v-model="item.url"
            placeholder="Ссылка: /post/... или https://..."
            icon="i-heroicons-link-20-solid"
            class="w-full"
          />
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
          label="Добавить тег"
          @click="addItem"
        />
      </div>
    </UFormField>
  </div>
</template>

<style scoped></style>
