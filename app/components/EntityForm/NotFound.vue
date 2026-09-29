<script setup lang="ts">
defineProps<{
  title: string;
  backTo: string;
  backLabel: string;
}>();
</script>

<template>
  <div class="mx-auto flex max-w-md flex-col items-center gap-4 px-4 py-24 text-center">
    <div class="flex size-14 items-center justify-center rounded-full bg-error/10 text-error">
      <UIcon name="i-lucide-file-x" class="size-7" />
    </div>
    <div>
      <p class="text-lg font-semibold text-highlighted">{{ title }}</p>
      <p class="mt-1 text-sm text-muted">Возможно, запись была удалена или ссылка устарела.</p>
    </div>
    <UButton :to="backTo" icon="i-lucide-arrow-left" :label="backLabel" color="neutral" variant="outline" />
  </div>
</template>
