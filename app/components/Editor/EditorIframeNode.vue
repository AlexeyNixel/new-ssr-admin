<script setup lang="ts">
import type { NodeViewProps } from '@tiptap/vue-3';
import { NodeViewWrapper } from '@tiptap/vue-3';

const props = defineProps<NodeViewProps>();

const attrs = computed(() => props.node.attrs);

// Размеры из кода встраивания: число → px, проценты оставляем как есть
const toCss = (value?: string | null) =>
  value ? (/^\d+$/.test(String(value)) ? `${value}px` : String(value)) : undefined;

const host = computed(() => {
  try {
    return new URL(attrs.value.src).hostname;
  } catch {
    return attrs.value.src;
  }
});

// Пока узел не выделен, iframe перекрыт — клик выделяет блок, а не уходит внутрь фрейма
const select = () => {
  const pos = props.getPos();
  if (typeof pos === 'number') props.editor.commands.setNodeSelection(pos);
};
</script>

<template>
  <NodeViewWrapper
    class="iframe-wrapper editor-iframe"
    :class="{ 'is-selected': selected }"
    data-drag-handle
  >
    <iframe
      :src="attrs.src"
      :title="attrs.title || undefined"
      :allow="attrs.allow || undefined"
      :style="{ width: toCss(attrs.width), height: toCss(attrs.height) }"
      frameborder="0"
      allowfullscreen
    />

    <div v-if="!selected" class="editor-iframe__overlay" @click="select" />

    <div v-if="selected && editor.isEditable" class="editor-iframe__bar">
      <span class="truncate text-xs text-muted">{{ host }}</span>
      <UButton
        icon="i-lucide-trash"
        color="error"
        variant="ghost"
        size="xs"
        title="Удалить iframe"
        @click="deleteNode()"
      />
    </div>
  </NodeViewWrapper>
</template>
