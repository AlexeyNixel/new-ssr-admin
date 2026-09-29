<script setup lang="ts">
// Пустое состояние таблицы: ничего не найдено / записей пока нет
defineProps<{
  searching?: boolean;
  icon?: string;
  title?: string;
}>();
defineEmits<{ reset: [] }>();
</script>

<template>
  <div class="flex flex-col items-center gap-3 px-4 py-14 text-center">
    <div class="flex size-12 items-center justify-center rounded-full bg-elevated text-muted">
      <UIcon :name="searching ? 'i-lucide-search-x' : icon || 'i-lucide-inbox'" class="size-6" />
    </div>
    <div>
      <p class="font-medium text-highlighted">
        {{ searching ? 'Ничего не найдено' : title || 'Записей пока нет' }}
      </p>
      <p v-if="searching" class="mt-1 text-sm text-muted">Попробуйте изменить запрос или фильтры</p>
    </div>
    <UButton
      v-if="searching"
      label="Сбросить фильтры"
      color="neutral"
      variant="outline"
      size="sm"
      @click="$emit('reset')"
    />
  </div>
</template>
