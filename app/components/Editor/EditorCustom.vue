<script setup lang="ts">
import type { EditorToolbarItem } from '#ui/components/EditorToolbar.vue';
import Image from '@tiptap/extension-image';
import type { Editor } from '@tiptap/vue-3';
import type { EditorCustomHandlers } from '#ui/types';
import type { EditorSuggestionMenuItem } from '#ui/components/EditorSuggestionMenu.vue';
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
    {
      kind: 'clearFormatting',
      icon: 'i-lucide-remove-formatting',
      tooltip: { text: 'Очистить форматирование' },
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
    { slot: 'document' as const },
    { slot: 'details' as const },
    { slot: 'iframe' as const },
  ],
];

// Меню команд по «/» в начале строки или после пробела.
// Без иконок: при фильтрации меню переиспользует элементы, и dev-режим
// @nuxt/icon кэширует CSS иконки со старой картинкой (heading-2 → type).
const suggestionItems: EditorSuggestionMenuItem[][] = [
  [
    { kind: 'paragraph', label: 'Обычный текст' },
    { kind: 'heading', level: 2, label: 'Заголовок 2', description: 'Крупный подзаголовок' },
    { kind: 'heading', level: 3, label: 'Заголовок 3', description: 'Средний подзаголовок' },
    { kind: 'heading', level: 4, label: 'Заголовок 4', description: 'Мелкий подзаголовок' },
  ],
  [
    { kind: 'bulletList', label: 'Маркированный список' },
    { kind: 'orderedList', label: 'Нумерованный список' },
    { kind: 'blockquote', label: 'Цитата' },
    { kind: 'horizontalRule', label: 'Разделитель' },
  ],
  [
    { kind: 'imageUpload', label: 'Изображение', description: 'Загрузить с компьютера' },
    { kind: 'insertTable', label: 'Таблица', description: '3 × 3 с заголовком' },
  ],
];

const countWords = (text: string) => text.split(/\s+/).filter(Boolean).length;
const readingMinutes = (words: number) => Math.max(1, Math.round(words / 180));

const bubbleToolBar: EditorToolbarItem[][] = [
  [
    { kind: 'mark', mark: 'bold', icon: 'i-lucide-bold', tooltip: { text: 'Жирный' } },
    { kind: 'mark', mark: 'italic', icon: 'i-lucide-italic', tooltip: { text: 'Курсив' } },
    { kind: 'mark', mark: 'underline', icon: 'i-lucide-underline', tooltip: { text: 'Подчёркнутый' } },
    { kind: 'mark', mark: 'strike', icon: 'i-lucide-strikethrough', tooltip: { text: 'Зачёркнутый' } },
    { kind: 'mark', mark: 'code', icon: 'i-lucide-code', tooltip: { text: 'Код' } },
    { kind: 'clearFormatting', icon: 'i-lucide-remove-formatting', tooltip: { text: 'Очистить форматирование' } },
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

/*
 * Встроенный обработчик списков @nuxt/ui (createListHandler) при снятии списка
 * вызывает lift('taskList') — у нас нет расширения TaskList, команда падает с
 * «There is no node type named 'taskList'» и повторный клик по списку ничего
 * не делает. Нативный toggle*List из Tiptap сам снимает список и переключает
 * маркированный ⇄ нумерованный.
 */
const createListHandler = (listType: 'bulletList' | 'orderedList') => {
  const toggle = (editor: Editor) =>
    listType === 'bulletList'
      ? editor.chain().focus().toggleBulletList()
      : editor.chain().focus().toggleOrderedList();

  return {
    // can().toggle*List() ложно отдаёт false внутри списка другого типа,
    // хотя сама команда переключает тип — поэтому внутри списка всегда разрешаем
    canExecute: (editor: Editor) =>
      editor.isActive('bulletList') ||
      editor.isActive('orderedList') ||
      (listType === 'bulletList'
        ? editor.can().toggleBulletList()
        : editor.can().toggleOrderedList()),
    execute: toggle,
    isActive: (editor: Editor) => editor.isActive(listType),
    isDisabled: (editor: Editor) => editor.isActive('code') || editor.isActive('image'),
  };
};

const toggleDetails = (editor: Editor) => {
  if (editor.isActive('details')) editor.chain().focus().unsetDetails().run();
  else editor.chain().focus().setDetails().run();
};

type AlignCmd = { align?: 'left' | 'center' | 'right' | 'justify' };

// Повторный клик по активному выравниванию сбрасывает его (как у заголовков/списков).
// «По левому краю» — выравнивание по умолчанию, подсвечиваем его и без атрибута.
const isAlignActive = (editor: Editor, align?: string) =>
  editor.isActive({ textAlign: align }) ||
  (align === 'left' &&
    (editor.isActive('paragraph') || editor.isActive('heading')) &&
    !['center', 'right', 'justify'].some((a) => editor.isActive({ textAlign: a })));

const customHandlers = {
  bulletList: createListHandler('bulletList'),
  orderedList: createListHandler('orderedList'),
  textAlign: {
    canExecute: (editor: Editor, cmd: AlignCmd) =>
      !!cmd.align && editor.can().setTextAlign(cmd.align),
    execute: (editor: Editor, cmd: AlignCmd) =>
      isAlignActive(editor, cmd.align)
        ? editor.chain().focus().unsetTextAlign()
        : editor.chain().focus().setTextAlign(cmd.align!),
    isActive: (editor: Editor, cmd: AlignCmd) => isAlignActive(editor, cmd.align),
    isDisabled: (editor: Editor) => editor.isActive('image') || editor.isActive('iframe'),
  },
  // Встроенный clearFormatting не трогает выравнивание — сбрасываем и его
  clearFormatting: {
    canExecute: (editor: Editor) => editor.can().clearNodes() || editor.can().unsetAllMarks(),
    execute: (editor: Editor) =>
      editor.chain().focus().clearNodes().unsetAllMarks().unsetTextAlign(),
    isActive: () => false,
    isDisabled: undefined,
  },
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
  <!--
    Тулбар прилипает к верху прокручиваемой области. Если над редактором
    есть своя липкая шапка, её высоту задают через --editor-toolbar-top.
  -->
  <UEditor
    v-slot="{ editor }"
    :handlers="customHandlers"
    :extensions="extensions"
    :image="false"
    content-type="html"
    placeholder="Начните писать или нажмите «/» для вставки блока"
    class="border border-default rounded-lg bg-default flex flex-col"
    :ui="{
      base: 'px-4 py-5 sm:px-8 min-h-64',
      content: 'max-w-3xl w-full mx-auto',
    }"
  >
    <UEditorToolbar
      :editor="editor"
      :items="items"
      class="sticky top-(--editor-toolbar-top,0px) z-10 rounded-t-lg border-b border-default bg-default/95 backdrop-blur px-1.5 py-1 flex-wrap gap-y-1"
    >
      <template #link>
        <EditorLinkPopover :editor="editor" auto-open />
      </template>

      <template #document>
        <EditorDocumentUpload :editor="editor" />
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
            @click="toggleDetails(editor)"
          />
        </UTooltip>
      </template>

      <template #iframe>
        <EditorIframePopover :editor="editor" />
      </template>
    </UEditorToolbar>

    <UEditorToolbar :editor="editor" :items="bubbleToolBar" layout="bubble" />

    <UEditorToolbar
      :editor="editor"
      :items="tableToolbar"
      layout="bubble"
      :should-show="({ editor, view }) => editor.isActive('table') && view.hasFocus()"
    />

    <UEditorSuggestionMenu :editor="editor" :items="suggestionItems" />

    <div
      class="order-last flex items-center justify-end gap-3 border-t border-default px-4 py-1.5 text-xs text-muted rounded-b-lg"
    >
      <span>{{ countWords(editor.getText()) }} сл.</span>
      <span>{{ editor.getText().length }} симв.</span>
      <span v-if="countWords(editor.getText())">~{{ readingMinutes(countWords(editor.getText())) }} мин чтения</span>
    </div>
  </UEditor>
</template>
