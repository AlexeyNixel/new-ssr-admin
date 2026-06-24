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
      icon: 'i-lucide-table-columns-split',
      tooltip: { text: 'Добавить столбец слева' },
    },
    {
      kind: 'addColumnAfter',
      icon: 'i-lucide-between-horizontal-end',
      tooltip: { text: 'Добавить столбец справа' },
    },
    {
      kind: 'deleteColumn',
      icon: 'i-lucide-between-horizontal-start',
      tooltip: { text: 'Удалить столбец' },
    },
  ],
  [
    {
      kind: 'addRowBefore',
      icon: 'i-lucide-between-vertical-end',
      tooltip: { text: 'Добавить строку выше' },
    },
    {
      kind: 'addRowAfter',
      icon: 'i-lucide-between-vertical-start',
      tooltip: { text: 'Добавить строку ниже' },
    },
    {
      kind: 'deleteRow',
      icon: 'i-lucide-rows-3',
      tooltip: { text: 'Удалить строку' },
    },
  ],
  [
    {
      kind: 'deleteTable',
      icon: 'i-lucide-table-2',
      tooltip: { text: 'Удалить таблицу' },
    },
  ],
];

const items: EditorToolbarItem[][] = [
  [
    {
      kind: 'undo',
      icon: 'i-lucide-undo',
      tooltip: { text: 'Отменить' },
    },
    {
      kind: 'redo',
      icon: 'i-lucide-redo',
      tooltip: { text: 'Повторить' },
    },
  ],
  [
    {
      icon: 'i-lucide-heading',
      tooltip: { text: 'Заголовки' },
      content: { align: 'start' },
      items: [
        { kind: 'heading', level: 1, icon: 'i-lucide-heading-1', label: 'Заголовок 1' },
        { kind: 'heading', level: 2, icon: 'i-lucide-heading-2', label: 'Заголовок 2' },
        { kind: 'heading', level: 3, icon: 'i-lucide-heading-3', label: 'Заголовок 3' },
        { kind: 'heading', level: 4, icon: 'i-lucide-heading-4', label: 'Заголовок 4' },
      ],
    },
    {
      kind: 'mark',
      mark: 'bold',
      icon: 'i-lucide-bold',
      tooltip: { text: 'Жирный' },
    },
    {
      kind: 'mark',
      mark: 'italic',
      icon: 'i-lucide-italic',
      tooltip: { text: 'Курсив' },
    },
    {
      kind: 'mark',
      mark: 'underline',
      icon: 'i-lucide-underline',
      tooltip: { text: 'Подчёркнутый' },
    },
    {
      kind: 'mark',
      mark: 'strike',
      icon: 'i-lucide-strikethrough',
      tooltip: { text: 'Зачёркнутый' },
    },
  ],
  [
    {
      icon: 'i-lucide-align-justify',
      tooltip: { text: 'Выравнивание' },
      content: { align: 'start' },
      items: [
        { kind: 'textAlign', align: 'left', icon: 'i-lucide-align-left', label: 'По левому краю' },
        { kind: 'textAlign', align: 'center', icon: 'i-lucide-align-center', label: 'По центру' },
        { kind: 'textAlign', align: 'right', icon: 'i-lucide-align-right', label: 'По правому краю' },
        { kind: 'textAlign', align: 'justify', icon: 'i-lucide-align-justify', label: 'По ширине' },
      ],
    },
    {
      icon: 'i-lucide-list',
      tooltip: { text: 'Списки' },
      content: { align: 'start' },
      items: [
        { kind: 'bulletList', icon: 'i-lucide-list', label: 'Маркированный список' },
        { kind: 'orderedList', icon: 'i-lucide-list-ordered', label: 'Нумерованный список' },
      ],
    },
    {
      kind: 'blockquote',
      icon: 'i-lucide-text-quote',
      tooltip: { text: 'Цитата' },
    },
    {
      kind: 'horizontalRule',
      icon: 'i-lucide-separator-horizontal',
      tooltip: { text: 'Горизонтальный разделитель' },
    },
  ],
  [
    { slot: 'link' as const },
    {
      kind: 'insertTable',
      icon: 'i-lucide-table',
      tooltip: { text: 'Вставить таблицу' },
    },
    {
      kind: 'imageUpload',
      icon: 'i-lucide-image',
      tooltip: { text: 'Загрузить изображение' },
    },
    { slot: 'details' as const },
    { slot: 'iframe' as const },
  ],
];

const bubbleToolBar: EditorToolbarItem[][] = [
  [
    { kind: 'mark', mark: 'bold', icon: 'i-lucide-bold', tooltip: { text: 'Жирный' } },
    { kind: 'mark', mark: 'italic', icon: 'i-lucide-italic', tooltip: { text: 'Курсив' } },
    { kind: 'mark', mark: 'underline', icon: 'i-lucide-underline', tooltip: { text: 'Подчёркнутый' } },
    { kind: 'mark', mark: 'strike', icon: 'i-lucide-strikethrough', tooltip: { text: 'Зачёркнутый' } },
    { kind: 'mark', mark: 'code', icon: 'i-lucide-code', tooltip: { text: 'Код' } },
  ],
  [
    {
      icon: 'i-lucide-heading',
      tooltip: { text: 'Заголовки' },
      content: { align: 'start' },
      items: [
        { kind: 'heading', level: 1, icon: 'i-lucide-heading-1', label: 'Заголовок 1' },
        { kind: 'heading', level: 2, icon: 'i-lucide-heading-2', label: 'Заголовок 2' },
        { kind: 'heading', level: 3, icon: 'i-lucide-heading-3', label: 'Заголовок 3' },
        { kind: 'heading', level: 4, icon: 'i-lucide-heading-4', label: 'Заголовок 4' },
      ],
    },
    {
      icon: 'i-lucide-list',
      tooltip: { text: 'Списки' },
      content: { align: 'start' },
      items: [
        { kind: 'bulletList', icon: 'i-lucide-list', label: 'Маркированный список' },
        { kind: 'orderedList', icon: 'i-lucide-list-ordered', label: 'Нумерованный список' },
      ],
    },
    { kind: 'blockquote', icon: 'i-lucide-text-quote', tooltip: { text: 'Цитата' } },
    { kind: 'horizontalRule', icon: 'i-lucide-separator-horizontal', tooltip: { text: 'Разделитель' } },
  ],
];

const extensions = [
  Iframe,
  Details.configure({
    persist: true,
    HTMLAttributes: { class: 'details' },
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
      directions: ['top', 'bottom', 'left', 'right'],
      minWidth: 50,
      minHeight: 50,
      alwaysPreserveAspectRatio: true,
    },
  }),
];

const addIframe = (editor: Editor) => {
  const input = window.prompt('Вставьте код iframe или URL');
  if (!input) return;

  let src = input;
  if (input.trim().startsWith('<')) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(input, 'text/html');
    const el = doc.body.firstChild as HTMLIFrameElement;
    src = el?.src || input;
  }

  editor.chain().focus().setIframe({ src }).run();
};

const customHandlers = {
  imageUpload: {
    canExecute: (editor: Editor) => editor.can().insertImageUpload(),
    execute: (editor: Editor) => editor.chain().focus().insertImageUpload(),
    isActive: (editor: Editor) => editor.isActive('imageUpload'),
    isDisabled: undefined,
  },
  insertTable: {
    canExecute: (editor: Editor) =>
      editor.can().insertTable({ rows: 3, cols: 3, withHeaderRow: true }),
    execute: (editor: Editor) =>
      editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }),
    isActive: () => false,
  },
  addColumnAfter: {
    canExecute: (editor: Editor) => editor.can().addColumnAfter(),
    execute: (editor: Editor) => editor.chain().focus().addColumnAfter(),
    isActive: () => false,
  },
  addColumnBefore: {
    canExecute: (editor: Editor) => editor.can().addColumnBefore(),
    execute: (editor: Editor) => editor.chain().focus().addColumnBefore(),
    isActive: () => false,
  },
  deleteColumn: {
    canExecute: (editor: Editor) => editor.can().deleteColumn(),
    execute: (editor: Editor) => editor.chain().focus().deleteColumn(),
    isActive: () => false,
  },
  addRowAfter: {
    canExecute: (editor: Editor) => editor.can().addRowAfter(),
    execute: (editor: Editor) => editor.chain().focus().addRowAfter(),
    isActive: () => false,
  },
  addRowBefore: {
    canExecute: (editor: Editor) => editor.can().addRowBefore(),
    execute: (editor: Editor) => editor.chain().focus().addRowBefore(),
    isActive: () => false,
  },
  deleteRow: {
    canExecute: (editor: Editor) => editor.can().deleteRow(),
    execute: (editor: Editor) => editor.chain().focus().deleteRow(),
    isActive: () => false,
  },
  deleteTable: {
    canExecute: (editor: Editor) => editor.can().deleteTable(),
    execute: (editor: Editor) => editor.chain().focus().deleteTable(),
    isActive: () => false,
  },
} satisfies EditorCustomHandlers;
</script>

<template>
  <UEditor
    v-slot="{ editor }"
    :handlers="customHandlers"
    :extensions="extensions"
    content-type="html"
    placeholder="Введите текст, / для команд"
    class="border border-accented rounded-lg"
    :ui="{
      base: 'p-4 sm:p-4',
      content: 'max-w-3xl mx-auto',
    }"
  >
    <UEditorToolbar :editor="editor" :items="items">
      <template #link>
        <EditorLinkPopover :editor="editor" auto-open />
      </template>

      <template #details>
        <UTooltip :text="editor.isActive('details') ? 'Убрать блок «Подробнее»' : 'Блок «Подробнее»'">
          <UButton
            icon="i-lucide-chevrons-up-down"
            color="neutral"
            active-color="primary"
            variant="ghost"
            active-variant="soft"
            size="sm"
            :active="editor.isActive('details')"
            :disabled="!editor.can().setDetails() && !editor.can().unsetDetails()"
            @click="
              editor.isActive('details')
                ? editor.chain().focus().unsetDetails().run()
                : editor.chain().focus().setDetails().run()
            "
          />
        </UTooltip>
      </template>

      <template #iframe>
        <UTooltip text="Вставить iframe">
          <UButton
            icon="i-lucide-monitor-play"
            color="neutral"
            variant="ghost"
            size="sm"
            @click="addIframe(editor)"
          />
        </UTooltip>
      </template>
    </UEditorToolbar>

    <UEditorToolbar :editor="editor" :items="bubbleToolBar" layout="bubble" />

    <UEditorToolbar
      :editor="editor"
      :items="tableToolbar"
      layout="bubble"
      :should-show="({ editor, view }) => editor.isActive('table') && view.hasFocus()"
    />
  </UEditor>
</template>
