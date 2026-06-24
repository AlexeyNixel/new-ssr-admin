<script setup lang="ts">
/* eslint-disable vue/no-mutating-props */
import type { PageRichTextBlock } from '~~/services/types/page.type';

const props = defineProps<{
  block: PageRichTextBlock;
}>();
</script>

<template>
  <UFormField label="Содержимое блока">
    <EditorCustom v-model="props.block.html" />
  </UFormField>
</template>

<style scoped></style>
