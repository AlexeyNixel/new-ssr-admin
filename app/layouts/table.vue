<script setup lang="ts">
/*
 * Каркас страницы-списка: липкая шапка (заголовок, счётчик, «Создать»),
 * панель поиска/фильтров, карточка с таблицей и пагинация.
 *
 * v-model — номер страницы, v-model:search — строка поиска (поле поиска
 * показывается, только если передан :search). Фильтры кладутся в слот #filters.
 */
interface Props {
  modelValue?: number;
  title?: string;
  description?: string;
  createLabel?: string;
  eventCreate?: () => void;
  meta?: {
    page?: number;
    limit: number | string;
    total: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  search?: string;
  searchPlaceholder?: string;
  loading?: boolean;
}
const props = withDefaults(defineProps<Props>(), {
  modelValue: 1,
  title: '',
  description: undefined,
  eventCreate: undefined,
  meta: undefined,
  search: undefined,
  createLabel: 'Создать запись',
  searchPlaceholder: 'Поиск по названию…',
});
const emits = defineEmits<{
  'update:modelValue': [value: number];
  'update:search': [value: string];
}>();
const slots = useSlots();

const page = computed({
  get: () => props.modelValue ?? 1,
  set: (value: number) => {
    if (import.meta.client) window.scroll({ top: 0, behavior: 'smooth' });
    emits('update:modelValue', value);
  },
});

// ---------- Поиск: живой, с задержкой; Enter — сразу ----------

const searchText = ref(props.search ?? '');
watch(
  () => props.search,
  (value) => {
    if ((value ?? '') !== searchText.value) searchText.value = value ?? '';
  }
);
const emitSearch = () => {
  if ((props.search ?? '') !== searchText.value.trim()) emits('update:search', searchText.value.trim());
};
watchDebounced(searchText, emitSearch, { debounce: 400 });
const clearSearch = () => {
  searchText.value = '';
};

// ---------- Счётчики ----------

const limit = computed(() => Number(props.meta?.limit) || 0);
const total = computed(() => Number(props.meta?.total) || 0);
const rangeFrom = computed(() => (total.value ? (page.value - 1) * limit.value + 1 : 0));
const rangeTo = computed(() => Math.min(page.value * limit.value, total.value));
const hasPages = computed(() => !!props.meta && (props.meta.hasNext || props.meta.hasPrev));

const numberFormat = new Intl.NumberFormat('ru-RU');
const fmt = (value: number) => numberFormat.format(value);

const showToolbar = computed(() => props.search !== undefined || !!slots.filters);
</script>

<template>
  <div class="min-h-screen bg-muted">
    <header class="sticky top-0 z-30 border-b border-default bg-default/90 backdrop-blur">
      <div class="mx-auto flex min-h-16 max-w-7xl items-center gap-3 px-4 py-2 sm:px-6">
        <div class="min-w-0 flex-1">
          <!-- ! — глобальный стиль h1 в main.css задан вне слоёв Tailwind -->
          <h1 class="mb-0! truncate text-lg! font-semibold! text-highlighted sm:text-xl!">{{ title }}</h1>
          <p v-if="description || meta" class="truncate text-xs text-muted sm:text-sm">
            <template v-if="description">{{ description }}</template>
            <template v-else-if="meta">Всего записей: {{ fmt(total) }}</template>
          </p>
        </div>

        <slot name="actions" />

        <UButton
          v-if="eventCreate"
          icon="i-lucide-plus"
          color="primary"
          @click="eventCreate()"
        >
          <span class="hidden sm:inline">{{ createLabel }}</span>
        </UButton>
      </div>
    </header>

    <div class="mx-auto max-w-7xl space-y-4 px-4 py-6 sm:px-6">
      <div
        v-if="showToolbar"
        class="flex flex-col gap-3 rounded-xl border border-default bg-default p-3 shadow-xs sm:flex-row sm:flex-wrap sm:items-center"
      >
        <UInput
          v-if="search !== undefined"
          v-model="searchText"
          :placeholder="searchPlaceholder"
          icon="i-lucide-search"
          class="w-full sm:max-w-sm sm:flex-1"
          :loading="loading && !!searchText"
          @keydown.enter="emitSearch"
        >
          <template v-if="searchText" #trailing>
            <UButton
              icon="i-lucide-x"
              color="neutral"
              variant="link"
              size="sm"
              aria-label="Очистить поиск"
              @click="clearSearch"
            />
          </template>
        </UInput>

        <div v-if="$slots.filters" class="flex flex-wrap items-center gap-2 sm:ms-auto">
          <slot name="filters" />
        </div>
      </div>

      <div class="overflow-hidden rounded-xl border border-default bg-default shadow-xs">
        <slot />
      </div>

      <div
        v-if="meta && total"
        class="flex flex-col items-center justify-between gap-3 text-sm text-muted sm:flex-row"
      >
        <span class="tabular-nums">
          Показаны {{ fmt(rangeFrom) }}–{{ fmt(rangeTo) }} из {{ fmt(total) }}
        </span>
        <UPagination
          v-if="hasPages"
          v-model:page="page"
          :total="total"
          :items-per-page="limit"
          :sibling-count="1"
          show-edges
        />
      </div>
    </div>
  </div>
</template>
