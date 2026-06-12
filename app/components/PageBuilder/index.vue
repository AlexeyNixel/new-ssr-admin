<script setup lang="ts">
import { useSortable } from '@vueuse/integrations/useSortable';
import type { PageBlock, PageBlockType } from '~~/services/types/page.type';
import { PAGE_BLOCK_TYPES, createPageBlock, getPageBlockMeta } from '~/constants/pageBlocks';

const blocks = defineModel<PageBlock[]>({ required: true });

const hasHero = computed(() => blocks.value.some((block) => block.type === 'hero'));

const addMenuItems = computed(() =>
  PAGE_BLOCK_TYPES.map((meta) => ({
    label: meta.label,
    description: meta.description,
    icon: meta.icon,
    disabled: meta.type === 'hero' && hasHero.value,
    onSelect: () => addBlock(meta.type),
  }))
);

const addBlock = (type: PageBlockType) => {
  const block = createPageBlock(type);

  if (type === 'hero') {
    blocks.value.unshift(block);
  } else {
    blocks.value.push(block);
  }
};

const removeBlock = (index: number) => {
  blocks.value.splice(index, 1);
};

const getSummary = (block: PageBlock): string | undefined => {
  switch (block.type) {
    case 'hero':
      return block.title;
    case 'stats':
      return `Пунктов: ${block.items.length}`;
    case 'features':
      return `Направлений: ${block.items.length}`;
    case 'tags':
      return block.title || `Тегов: ${block.items.length}`;
    case 'advantages':
      return block.title;
    case 'highlight':
      return block.title;
    case 'person':
      return block.name;
    case 'banner':
      return block.text;
    case 'richText':
      return 'Произвольный HTML-контент';
  }
};

useSortable('.page-blocks-list', blocks, {
  animation: 150,
  handle: '.page-block-drag-handle',
});
</script>

<template>
  <div class="space-y-4">
    <p v-if="!blocks.length" class="text-sm text-neutral-500 dark:text-neutral-400">
      Блоков пока нет — добавьте первый блок ниже
    </p>

    <div class="page-blocks-list space-y-3">
      <PageBuilderBlockCard
        v-for="(block, index) in blocks"
        :key="index"
        :icon="getPageBlockMeta(block.type).icon"
        :label="getPageBlockMeta(block.type).label"
        :summary="getSummary(block)"
        @remove="removeBlock(index)"
      >
        <PageBuilderBlockHero v-if="block.type === 'hero'" :block="block" />
        <PageBuilderBlockStats v-else-if="block.type === 'stats'" :block="block" />
        <PageBuilderBlockFeatures v-else-if="block.type === 'features'" :block="block" />
        <PageBuilderBlockTags v-else-if="block.type === 'tags'" :block="block" />
        <PageBuilderBlockAdvantages v-else-if="block.type === 'advantages'" :block="block" />
        <PageBuilderBlockHighlight v-else-if="block.type === 'highlight'" :block="block" />
        <PageBuilderBlockPerson v-else-if="block.type === 'person'" :block="block" />
        <PageBuilderBlockBanner v-else-if="block.type === 'banner'" :block="block" />
        <PageBuilderBlockRichText v-else-if="block.type === 'richText'" :block="block" />
      </PageBuilderBlockCard>
    </div>

    <UDropdownMenu :items="addMenuItems" :content="{ align: 'start' }">
      <UButton
        icon="i-heroicons-plus-20-solid"
        color="neutral"
        variant="subtle"
        label="Добавить блок"
      />
    </UDropdownMenu>
  </div>
</template>

<style scoped></style>
