<script setup lang="ts">
// Превью картинки в строке списка; без картинки — плашка с иконкой
const props = withDefaults(
  defineProps<{
    path?: string | null;
    icon?: string;
    /** CSS aspect-ratio */
    aspect?: string;
    width?: string;
  }>(),
  { path: undefined, icon: 'i-lucide-image', aspect: '1 / 1', width: '3rem' }
);

const failed = ref(false);
const src = computed(() => (failed.value ? '' : staticUrl(props.path)));
</script>

<template>
  <div
    class="shrink-0 overflow-hidden rounded-md border border-default bg-elevated"
    :style="{ aspectRatio: aspect, width }"
  >
    <img
      v-if="src"
      :src="src"
      alt=""
      loading="lazy"
      class="size-full object-cover"
      @error="failed = true"
    >
    <div v-else class="flex size-full items-center justify-center text-dimmed">
      <UIcon :name="icon" class="size-5" />
    </div>
  </div>
</template>
