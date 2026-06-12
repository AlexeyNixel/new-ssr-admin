<script setup lang="ts">
import type { PageAdvantagesBlock } from '~~/services/types/page.type';

const props = defineProps<{
  block: PageAdvantagesBlock;
}>();
</script>

<template>
  <div class="space-y-4">
    <UFormField label="Заголовок" required>
      <UInput
        v-model="props.block.title"
        placeholder="Преимущества участия"
        class="w-full"
      />
    </UFormField>
    <UFormField label="Пункты">
      <PageBuilderRepeatableList
        v-model="props.block.items"
        placeholder="Например: бесплатное участие"
        add-label="Добавить пункт"
      />
    </UFormField>
  </div>
</template>

<style scoped></style>
