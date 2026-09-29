<script setup lang="ts">
// Карточка-секция формы. Без title — просто контейнер (например, для одного поля).
defineProps<{
  title?: string;
  icon?: string;
}>();
</script>

<template>
  <section class="space-y-4 rounded-xl border border-default bg-default p-4 shadow-xs">
    <div
      v-if="title || $slots.trailing"
      class="flex items-center justify-between gap-2 text-sm font-semibold text-highlighted"
    >
      <span class="flex items-center gap-2">
        <UIcon v-if="icon" :name="icon" class="size-4 text-muted" />
        {{ title }}
      </span>
      <slot name="trailing" />
    </div>
    <slot />
  </section>
</template>
