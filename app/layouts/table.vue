<script setup lang="ts">
import { UButton } from '#components';
interface Props {
  modelValue: number;
  title: string;
  eventCreate: Function;
  meta: {
    limit: number;
    total: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  search?: string;
}
const props = defineProps<Props>();
const emits = defineEmits(['update:modelValue', 'update:search']);

const page = ref(props.modelValue);
const searchText = ref('');

const handleSwapPage = () => {
  if (import.meta.client) {
    window.scroll(0, 0);
  }
  emits('update:modelValue', page.value);
};

const handleSearch = () => {
  emits('update:search', searchText.value);
};
</script>

<template>
  <div class="min-h-full p-6 bg-gray-50">
    <div class="flex justify-between items-center">
      <div>
        <h1 class="text-gray-900">{{ title }}</h1>
        <p class="text-gray-600 mt-1">Всего записей: {{ meta.total }}</p>
      </div>

      <UButton
        icon="i-heroicons-plus"
        label="Создать запись"
        color="secondary"
        variant="subtle"
        size="lg"
        @click="eventCreate()"
      />
    </div>

    <div
      v-if="search !== undefined"
      class="bg-white rounded-lg shadow-sm border border-gray-200 p-4 my-6"
    >
      <div class="flex items-center gap-4">
        <UInput
          v-model="searchText"
          placeholder="Поиск по названию..."
          icon="i-heroicons-magnifying-glass"
          class="flex-1 max-w-md"
          @keydown.enter="handleSearch"
        />
        <div class="text-sm text-gray-500">Найдено: {{ meta.total || 0 }}</div>
      </div>
    </div>

    <div
      class="mt-6 bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden"
    >
      <slot />
    </div>

    <div
      class="flex items-center justify-between mt-6 p-6 bg-white shadow-md border border-gray-200 rounded-lg overflow-hidden"
    >
      <div class="text-sm text-gray-500">
        Показано {{ meta.limit }} из
        {{ meta.total }}
      </div>
      <UPagination
        v-if="meta?.hasNext || meta?.hasPrev"
        v-model:page="page"
        :total="meta?.total"
        :items-per-page="Number(meta?.limit)"
        @update:page="handleSwapPage"
      />
    </div>
  </div>
</template>

<style scoped></style>
