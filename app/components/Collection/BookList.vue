<script setup lang="ts">
import Sortable from 'sortablejs';
import type { Book } from '~~/services/types/book.type';

// Книги подборки в порядке показа на сайте: перетаскивание за ручку
// или стрелками (клавиатура), удаление крестиком
const books = defineModel<Book[]>({ required: true });

const listRef = useTemplateRef<HTMLElement>('listRef');
let sortable: Sortable | undefined;

const move = (from: number, to: number) => {
  if (to < 0 || to >= books.value.length || from === to) return;
  const next = [...books.value];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item!);
  books.value = next;
};

const remove = (index: number) => {
  books.value = books.value.filter((_, i) => i !== index);
};

onMounted(() => {
  if (!listRef.value) return;
  sortable = Sortable.create(listRef.value, {
    handle: '.drag-handle',
    animation: 150,
    ghostClass: 'opacity-40',
    onEnd: ({ oldIndex, newIndex, item, from }) => {
      if (oldIndex == null || newIndex == null || oldIndex === newIndex) return;
      // Возвращаем DOM как был — порядок перерисует Vue из массива
      from.removeChild(item);
      from.insertBefore(item, from.children[oldIndex] ?? null);
      move(oldIndex, newIndex);
    },
  });
});

onBeforeUnmount(() => sortable?.destroy());
</script>

<template>
  <div>
    <ol ref="listRef" class="divide-y divide-default">
      <li
        v-for="(book, index) in books"
        :key="book.id"
        class="flex items-center gap-3 bg-default py-2.5"
      >
        <button
          type="button"
          class="drag-handle flex cursor-grab touch-none items-center text-dimmed hover:text-default active:cursor-grabbing"
          :aria-label="`Перетащить «${book.title}»`"
        >
          <UIcon name="i-lucide-grip-vertical" class="size-5" />
        </button>

        <span class="w-6 shrink-0 text-right text-sm tabular-nums text-muted">{{ index + 1 }}</span>

        <ListThumb :path="book.preview?.path" icon="i-lucide-book" aspect="2 / 3" width="2.5rem" />

        <div class="min-w-0 flex-1">
          <p class="line-clamp-2 text-sm font-medium text-highlighted">
            {{ book.title }}
          </p>
          <p class="flex items-center gap-1.5 truncate text-xs text-muted">
            <UBadge
              v-if="book.isDeleted"
              label="Книга скрыта — на сайте её не будет"
              color="warning"
              variant="subtle"
              size="sm"
            />
            <span v-else class="truncate">{{ book.place }}</span>
          </p>
        </div>

        <div class="flex shrink-0 items-center">
          <UButton
            icon="i-lucide-arrow-up"
            color="neutral"
            variant="ghost"
            size="sm"
            :disabled="index === 0"
            aria-label="Выше"
            @click="move(index, index - 1)"
          />
          <UButton
            icon="i-lucide-arrow-down"
            color="neutral"
            variant="ghost"
            size="sm"
            :disabled="index === books.length - 1"
            aria-label="Ниже"
            @click="move(index, index + 1)"
          />
          <UButton
            icon="i-lucide-x"
            color="error"
            variant="ghost"
            size="sm"
            :aria-label="`Убрать «${book.title}» из подборки`"
            @click="remove(index)"
          />
        </div>
      </li>
    </ol>

    <div
      v-if="!books.length"
      class="rounded-lg border-2 border-dashed border-default px-4 py-8 text-center text-sm text-muted"
    >
      В подборке пока нет книг. Добавьте их из каталога ниже — порядок потом можно поменять перетаскиванием.
    </div>
  </div>
</template>
