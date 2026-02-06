<script setup lang="ts">
import type { EditorToolbarItem } from '#ui/components/EditorToolbar.vue';

const items: EditorToolbarItem[][] = [
  [
    {
      kind: 'undo',
      icon: 'i-lucide-undo',
      tooltip: { text: 'Undo' },
    },
    {
      kind: 'redo',
      icon: 'i-lucide-redo',
      tooltip: { text: 'Redo' },
    },
  ],
  // Block types
  [
    {
      icon: 'i-lucide-heading',
      tooltip: { text: 'Headings' },
      content: {
        align: 'start',
      },
      items: [
        {
          kind: 'heading',
          level: 1,
          icon: 'i-lucide-heading-1',
          label: 'Heading 1',
        },
        {
          kind: 'heading',
          level: 2,
          icon: 'i-lucide-heading-2',
          label: 'Heading 2',
        },
        {
          kind: 'heading',
          level: 3,
          icon: 'i-lucide-heading-3',
          label: 'Heading 3',
        },
        {
          kind: 'heading',
          level: 4,
          icon: 'i-lucide-heading-4',
          label: 'Heading 4',
        },
      ],
    },
    {
      icon: 'i-lucide-list',
      tooltip: { text: 'Lists' },
      content: {
        align: 'start',
      },
      items: [
        {
          kind: 'bulletList',
          icon: 'i-lucide-list',
          label: 'Bullet List',
        },
        {
          kind: 'orderedList',
          icon: 'i-lucide-list-ordered',
          label: 'Ordered List',
        },
      ],
    },
    {
      kind: 'blockquote',
      icon: 'i-lucide-text-quote',
      tooltip: { text: 'Blockquote' },
    },
    {
      kind: 'codeBlock',
      icon: 'i-lucide-square-code',
      tooltip: { text: 'Code Block' },
    },
    {
      kind: 'horizontalRule',
      icon: 'i-lucide-separator-horizontal',
      tooltip: { text: 'Horizontal Rule' },
    },
  ],
  // Text formatting
  [
    {
      kind: 'mark',
      mark: 'bold',
      icon: 'i-lucide-bold',
      tooltip: { text: 'Bold' },
    },
    {
      kind: 'mark',
      mark: 'italic',
      icon: 'i-lucide-italic',
      tooltip: { text: 'Italic' },
    },
    {
      kind: 'mark',
      mark: 'underline',
      icon: 'i-lucide-underline',
      tooltip: { text: 'Underline' },
    },
    {
      kind: 'mark',
      mark: 'strike',
      icon: 'i-lucide-strikethrough',
      tooltip: { text: 'Strikethrough' },
    },
    {
      kind: 'mark',
      mark: 'code',
      icon: 'i-lucide-code',
      tooltip: { text: 'Code' },
    },
  ],
  // Link
  [
    {
      kind: 'link',
      icon: 'i-lucide-link',
      tooltip: { text: 'Link' },
    },
  ],
];
</script>

<template>
  <UEditor v-slot="{ editor }">
    <UEditorToolbar :editor="editor" :items="items" />
  </UEditor>
</template>
