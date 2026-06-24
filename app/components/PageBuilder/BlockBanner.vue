<script setup lang="ts">
/* eslint-disable vue/no-mutating-props */
import type { PageBannerBlock } from '~~/services/types/page.type';

const props = defineProps<{
  block: PageBannerBlock;
}>();
</script>

<template>
  <UFormField label="Текст баннера" required>
    <UTextarea
      v-model="props.block.text"
      :rows="2"
      placeholder="Присоединяйтесь к нам!"
      class="w-full"
    />
  </UFormField>
</template>

<style scoped></style>
