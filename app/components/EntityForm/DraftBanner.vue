<script setup lang="ts">
import type { DraftAutosave } from '~/composables/useDraftAutosave';

// Плашка «Есть несохранённый черновик» над формой редактирования
const props = defineProps<{ draft: DraftAutosave }>();

const savedAtLabel = computed(() => {
  const savedAt = props.draft.pending.value?.savedAt;
  return savedAt
    ? new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' }).format(savedAt)
    : '';
});
</script>

<template>
  <UAlert
    v-if="draft.pending.value"
    color="warning"
    variant="subtle"
    icon="i-lucide-history"
    title="Есть несохранённый черновик"
    :description="`Изменения от ${savedAtLabel} не были сохранены. Восстановить их в форме?`"
    orientation="horizontal"
    :actions="[
      { label: 'Восстановить', color: 'warning', icon: 'i-lucide-rotate-ccw', onClick: draft.restore },
      { label: 'Отбросить', color: 'neutral', variant: 'ghost', onClick: draft.discard },
    ]"
  />
</template>
