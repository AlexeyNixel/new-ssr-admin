<script setup lang="ts">
import type { EditorToolbarItem } from '#ui/components/EditorToolbar.vue';
import Image from '@tiptap/extension-image';
import type { Editor } from '@tiptap/vue-3';
import type { EditorCustomHandlers } from '#ui/types';
import ImageUpload from './EditorImageUploadExtension';
import { TableKit } from '@tiptap/extension-table';
import { TextAlign } from '@tiptap/extension-text-align';
import {
  Details,
  DetailsContent,
  DetailsSummary,
} from '@tiptap/extension-details';
import Iframe from '~/components/Editor/iframe';

const tableToolbar: EditorToolbarItem[][] = [
  [
    {
      kind: 'addColumnBefore',
      icon: 'wordpress:table-column-before',
    },
    {
      kind: 'addColumnAfter',
      icon: 'wordpress:table-column-after',
    },
  ],
  [
    {
      kind: 'addRowBefore',
      icon: 'wordpress:table-row-before',
    },
    {
      kind: 'addRowAfter',
      icon: 'wordpress:table-row-after',
    },
  ],
];

const items: EditorToolbarItem[][] = [
  // History controls
  [
    {
      kind: 'undo',
      icon: 'i-lucide-undo',
      tooltip: { text: 'Undo' },
    },
  ],
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
  ],
  [
    {
      icon: 'i-lucide-align-justify',
      tooltip: { text: 'Text Align' },
      content: {
        align: 'end',
      },
      items: [
        {
          kind: 'textAlign',
          align: 'left',
          icon: 'i-lucide-align-left',
          label: 'Align Left',
        },
        {
          kind: 'textAlign',
          align: 'center',
          icon: 'i-lucide-align-center',
          label: 'Align Center',
        },
        {
          kind: 'textAlign',
          align: 'right',
          icon: 'i-lucide-align-right',
          label: 'Align Right',
        },
        {
          kind: 'textAlign',
          align: 'justify',
          icon: 'i-lucide-align-justify',
          label: 'Align Justify',
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
      kind: 'horizontalRule',
      icon: 'i-lucide-separator-horizontal',
      tooltip: { text: 'Horizontal Rule' },
    },
  ],
  [
    {
      slot: 'link' as const,
    },
    {
      kind: 'insertTable',
      icon: 'material-symbols:image-outline',
      tooltip: { text: 'Вставить таблицу' },
    },
    {
      kind: 'imageUpload',
      icon: 'material-symbols:image-outline',
      tooltip: { text: 'Загрузить изображение' },
    },
  ],
];
const bubbleToolBar = [
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
      kind: 'horizontalRule',
      icon: 'i-lucide-separator-horizontal',
      tooltip: { text: 'Horizontal Rule' },
    },
  ],
];
const extensions = [
  Iframe,
  Details.configure({
    persist: true,
    HTMLAttributes: {
      class: 'details',
    },
  }),
  DetailsSummary,
  DetailsContent,
  TextAlign.configure({ types: ['heading', 'paragraph'] }),
  TableKit.configure({
    table: { resizable: true },
  }),
  ImageUpload,
  Image.configure({
    resize: {
      enabled: true,
      directions: ['top', 'bottom', 'left', 'right'], // can be any direction or diagonal combination
      minWidth: 50,
      minHeight: 50,
      alwaysPreserveAspectRatio: true,
    },
  }),
];

const addIframe = (editor: Editor) => {
  const iframe = window.prompt('URL');

  if (!iframe) {
    return 'элемент не найден';
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(iframe, 'text/html');
  const iframeElement = doc.body.firstChild as HTMLIFrameElement;
  console.log(iframeElement.width, iframeElement.height);

  editor
    .chain()
    .focus()
    .setIframe({
      src: iframeElement?.src,
      name: iframeElement?.name || '',
      width: iframeElement?.width || '100%',
      height: iframeElement?.height || '100%',
    })
    .run();
};

const customHandlers = {
  imageUpload: {
    canExecute: (editor: Editor) =>
      editor.can().insertContent({ type: 'imageUpload' }),
    execute: (editor: Editor) =>
      editor.chain().focus().insertContent({ type: 'imageUpload' }),
    isActive: (editor: Editor) => editor.isActive('imageUpload'),
    isDisabled: undefined,
  },
  insertTable: {
    canExecute: (editor: Editor) =>
      editor.can().insertTable({ rows: 3, cols: 3, withHeaderRow: true }),
    execute: (editor: Editor) =>
      editor
        .chain()
        .focus()
        .insertTable({ rows: 3, cols: 3, withHeaderRow: true }),
    isActive: (editor: Editor) => editor.isActive('insertTable'),
  },
  addColumnAfter: {
    canExecute: (editor: Editor) => editor.can().addColumnAfter(),
    execute: (editor: Editor) => editor.chain().focus().addColumnAfter(),
    isActive: (editor: Editor) => editor.isActive('addColumnAfter'),
  },
  addColumnBefore: {
    canExecute: (editor: Editor) => editor.can().addColumnBefore(),
    execute: (editor: Editor) => editor.chain().focus().addColumnBefore(),
    isActive: (editor: Editor) => editor.isActive('addColumnBefore'),
  },

  addRowAfter: {
    canExecute: (editor: Editor) => editor.can().addRowAfter(),
    execute: (editor: Editor) => editor.chain().focus().addRowAfter(),
    isActive: (editor: Editor) => editor.isActive('addRowAfter'),
  },
  addRowBefore: {
    canExecute: (editor: Editor) => editor.can().addRowBefore(),
    execute: (editor: Editor) => editor.chain().focus().addRowBefore(),
    isActive: (editor: Editor) => editor.isActive('addRowBefore'),
  },
} satisfies EditorCustomHandlers;
</script>

<template>
  <UEditor
    v-slot="{ editor }"
    :handlers="customHandlers"
    :extensions="extensions"
    content-type="html"
    placeholder="Вводите, / для команд"
    :ui="{
      base: 'p-4 sm:p-4',
      content: 'max-w-3xl mx-auto',
    }"
  >
    <!--    <UButton-->
    <!--      @click="editor.chain().focus().setDetails().run()"-->
    <!--      :disabled="!editor.can().setDetails()"-->
    <!--    >-->
    <!--      Set details-->
    <!--    </UButton>-->
    <UButton @click="addIframe(editor)"> Set iframe </UButton>
    <UEditorToolbar :editor="editor" :items="items">
      <template #link>
        <EditorLinkPopover :editor="editor" auto-open />
      </template>
    </UEditorToolbar>
    <UEditorToolbar :editor="editor" :items="bubbleToolBar" layout="bubble" />
    <UEditorToolbar
      :editor="editor"
      :items="tableToolbar"
      layout="bubble"
      :should-show="
        ({ editor, view }) => {
          return editor.isActive('table') && view.hasFocus();
        }
      "
    />
  </UEditor>
</template>
