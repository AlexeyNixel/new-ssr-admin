<script setup lang="ts">
import LayoutAside from '~/components/LayoutAside.vue';
</script>

<template>
  <div class="bg-neutral-200 min-h-screen flex">
    <div class="aside w-[300px]">
      <LayoutAside />
    </div>
    <div class="w-full">
      <slot />
    </div>
  </div>
</template>

<style scoped></style>
