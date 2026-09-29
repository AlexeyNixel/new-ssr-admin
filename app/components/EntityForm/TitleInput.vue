<script setup lang="ts">
// Крупное поле заголовка без рамки — как в редакторе новостей
const model = defineModel<string>({ required: true });

defineProps<{
  placeholder: string;
  name?: string;
}>();

defineEmits<{ enter: [] }>();
</script>

<template>
  <UFormField :name="name ?? 'title'" :data-field="name ?? 'title'" :ui="{ error: 'mt-1' }">
    <UTextarea
      v-model="model"
      :placeholder="placeholder"
      :aria-label="placeholder"
      variant="none"
      autoresize
      :rows="1"
      :maxrows="4"
      class="w-full"
      :ui="{ base: 'p-0 overflow-hidden text-2xl font-bold leading-tight text-highlighted sm:text-3xl placeholder:text-dimmed resize-none' }"
      @keydown.enter.prevent="$emit('enter')"
    />
  </UFormField>
</template>
