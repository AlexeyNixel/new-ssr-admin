<script setup lang="ts">
defineProps<{
  icon: string;
  label: string;
  summary?: string;
}>();

defineEmits<{ remove: [] }>();
</script>

<template>
  <div
    class="rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 overflow-hidden"
  >
    <div
      class="flex items-center gap-3 px-4 py-3 bg-neutral-50 dark:bg-neutral-800/50 border-b border-neutral-200 dark:border-neutral-700"
    >
      <UIcon
        name="i-heroicons-bars-2-20-solid"
        class="page-block-drag-handle cursor-grab text-neutral-400 w-5 h-5 shrink-0"
      />
      <UIcon :name="icon" class="w-5 h-5 text-primary shrink-0" />
      <div class="min-w-0">
        <p class="font-medium text-sm text-neutral-900 dark:text-white truncate">
          {{ label }}
        </p>
        <p
          v-if="summary"
          class="text-xs text-neutral-500 dark:text-neutral-400 truncate"
        >
          {{ summary }}
        </p>
      </div>
      <UButton
        icon="i-heroicons-trash-20-solid"
        color="error"
        variant="ghost"
        size="xs"
        class="ml-auto shrink-0"
        @click="$emit('remove')"
      />
    </div>
    <div class="p-4 space-y-4">
      <slot />
    </div>
  </div>
</template>

<style scoped></style>
