<script setup lang="ts">
import type { PageHighlightBlock } from '~~/services/types/page.type';

const props = defineProps<{
  block: PageHighlightBlock;
}>();
</script>

<template>
  <div class="space-y-4">
    <UFormField label="Заголовок" required>
      <UInput
        v-model="props.block.title"
        placeholder="Название проекта или анонса"
        class="w-full"
      />
    </UFormField>
    <UFormField label="Описание" required>
      <UTextarea
        v-model="props.block.description"
        :rows="3"
        placeholder="Описание проекта"
        class="w-full"
      />
    </UFormField>
    <UFormField label="Бейдж" description="Необязательно, например: 🎬 Присоединяйтесь!">
      <UInput v-model="props.block.badge" placeholder="🎬 Присоединяйтесь!" class="w-full" />
    </UFormField>
  </div>
</template>

<style scoped></style>
