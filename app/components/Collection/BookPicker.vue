<script setup lang="ts">
import type { Book } from '~~/services/types/book.type';

// Каталог книг для подборки: поиск по названию, добавление в один клик.
// Книги уже в подборке помечены — повторный клик убирает их.
const props = defineProps<{
  books: Book[];
  selectedIds: string[];
  loading?: boolean;
}>();

const emit = defineEmits<{ toggle: [book: Book] }>();

const search = ref('');
const hideAdded = ref(false);

const selected = computed(() => new Set(props.selectedIds));

const filtered = computed(() => {
  const query = search.value.trim().toLowerCase();
  return props.books.filter(
    (book) =>
      (!query || book.title.toLowerCase().includes(query) || book.place?.toLowerCase().includes(query))
      && !(hideAdded.value && selected.value.has(book.id))
  );
});
</script>

<template>
  <div class="space-y-4">
    <div class="flex flex-wrap items-center gap-3">
      <UInput
        v-model="search"
        icon="i-lucide-search"
        placeholder="Название книги или место хранения"
        class="min-w-0 flex-1"
      />
      <USwitch v-model="hideAdded" label="Скрыть добавленные" />
    </div>

    <div v-if="loading" class="grid grid-cols-3 gap-3 sm:grid-cols-4 xl:grid-cols-6">
      <USkeleton v-for="i in 12" :key="i" class="aspect-[2/3] w-full" />
    </div>

    <div
      v-else-if="filtered.length"
      class="grid max-h-[560px] grid-cols-3 gap-3 overflow-y-auto pr-1 sm:grid-cols-4 xl:grid-cols-6"
    >
      <button
        v-for="book in filtered"
        :key="book.id"
        type="button"
        class="group text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        :aria-pressed="selected.has(book.id)"
        @click="emit('toggle', book)"
      >
        <span class="relative block overflow-hidden rounded-md border border-default bg-elevated">
          <img
            :src="staticUrl(book.preview?.path)"
            alt=""
            loading="lazy"
            class="aspect-[2/3] w-full object-cover transition-opacity"
            :class="{ 'opacity-50': book.isDeleted }"
          >
          <span
            class="absolute inset-0 flex items-center justify-center transition-colors"
            :class="selected.has(book.id) ? 'bg-primary/55' : 'bg-black/0 group-hover:bg-black/35'"
          >
            <UIcon
              :name="selected.has(book.id) ? 'i-lucide-check' : 'i-lucide-plus'"
              class="size-8 text-white drop-shadow transition-opacity"
              :class="selected.has(book.id) ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'"
            />
          </span>
          <UBadge
            v-if="book.isDeleted"
            label="Скрыта"
            color="warning"
            size="sm"
            class="absolute left-1 top-1"
          />
        </span>
        <span class="mt-1.5 line-clamp-2 text-xs font-medium text-default">{{ book.title }}</span>
      </button>
    </div>

    <p v-else class="py-6 text-center text-sm text-muted">
      {{ search ? `Книг по запросу «${search}» нет` : 'Все книги уже в подборке' }}
    </p>
  </div>
</template>
