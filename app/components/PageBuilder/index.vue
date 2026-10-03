<script setup lang="ts">
import { useSortable } from '@vueuse/integrations/useSortable';
import type { PageBlock, PageBlockType } from '~~/services/types/page.type';
import {
  PAGE_BLOCK_TYPES,
  createPageBlock,
  getPageBlockMeta,
  getPageBlockSummary,
} from '~/constants/pageBlocks';
import { stringifyPageBlocks } from '~/utils/pageBlockCode';

const blocks = defineModel<PageBlock[]>({ required: true });

const hasHero = computed(() =>
  blocks.value.some((block) => block.type === 'hero')
);

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

const toast = useToast();
const { copy } = useClipboard({ legacy: true });

const showCodeImport = ref(false);
const openCodeImport = () => {
  showCodeImport.value = true;
};

const addBlocksFromCode = (imported: PageBlock[]) => {
  const hero = imported.find((block) => block.type === 'hero');
  if (hero) blocks.value.unshift(hero);
  blocks.value.push(...imported.filter((block) => block.type !== 'hero'));

  showCodeImport.value = false;
  toast.add({
    title:
      imported.length > 1
        ? `Добавлено блоков: ${imported.length}`
        : 'Блок добавлен',
    color: 'success',
  });
};

const copyCode = async (data: PageBlock | PageBlock[]) => {
  await copy(stringifyPageBlocks(data));
  toast.add({
    title: 'Код скопирован',
    color: 'success',
    icon: 'i-heroicons-clipboard-document-check',
  });
};

useSortable('.page-blocks-list', blocks, {
  animation: 150,
  handle: '.page-block-drag-handle',
});
</script>

<template>
  <div class="space-y-4">
    <p
      v-if="!blocks.length"
      class="text-sm text-neutral-500 dark:text-neutral-400"
    >
      Блоков пока нет — добавьте первый блок ниже
    </p>

    <div class="page-blocks-list space-y-3">
      <PageBuilderBlockCard
        v-for="(block, index) in blocks"
        :key="index"
        :icon="getPageBlockMeta(block.type).icon"
        :label="getPageBlockMeta(block.type).label"
        :summary="getPageBlockSummary(block)"
        @remove="removeBlock(index)"
        @copy="copyCode(block)"
      >
        <PageBuilderBlockHero v-if="block.type === 'hero'" :block="block" />
        <PageBuilderBlockStats
          v-else-if="block.type === 'stats'"
          :block="block"
        />
        <PageBuilderBlockFeatures
          v-else-if="block.type === 'features'"
          :block="block"
        />
        <PageBuilderBlockTags
          v-else-if="block.type === 'tags'"
          :block="block"
        />
        <PageBuilderBlockAdvantages
          v-else-if="block.type === 'advantages'"
          :block="block"
        />
        <PageBuilderBlockHighlight
          v-else-if="block.type === 'highlight'"
          :block="block"
        />
        <PageBuilderBlockPerson
          v-else-if="block.type === 'person'"
          :block="block"
        />
        <PageBuilderBlockBanner
          v-else-if="block.type === 'banner'"
          :block="block"
        />
        <PageBuilderBlockRichText
          v-else-if="block.type === 'richText'"
          :block="block"
        />
        <PageBuilderBlockArchive
          v-else-if="block.type === 'archive'"
          :block="block"
        />
      </PageBuilderBlockCard>
    </div>

    <PageBuilderCodeImport
      v-if="showCodeImport"
      :has-hero="hasHero"
      @add="addBlocksFromCode"
      @cancel="showCodeImport = false"
    />

    <div class="flex flex-wrap items-center gap-2">
      <UDropdownMenu :items="addMenuItems" :content="{ align: 'start' }">
        <UButton
          icon="i-heroicons-plus-20-solid"
          color="neutral"
          variant="subtle"
          label="Добавить блок"
        />
      </UDropdownMenu>
      <UButton
        v-if="!showCodeImport"
        icon="i-heroicons-code-bracket-20-solid"
        color="neutral"
        variant="ghost"
        label="Вставить код"
        @click="openCodeImport"
      />
      <UButton
        v-if="blocks.length"
        icon="i-heroicons-clipboard-document-20-solid"
        color="neutral"
        variant="ghost"
        label="Скопировать код всех блоков"
        @click="copyCode(blocks)"
      />
    </div>
  </div>
</template>

<style scoped></style>
