<script setup lang="ts">
import type { PageTagsBlock } from '~~/services/types/page.type';

const props = defineProps<{
  block: PageTagsBlock;
}>();
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
    <UFormField label="Теги">
      <PageBuilderRepeatableList
        v-model="props.block.items"
        placeholder="Например: драма"
        add-label="Добавить тег"
      />
    </UFormField>
  </div>
</template>

<style scoped></style>
