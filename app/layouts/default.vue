<script setup lang="ts">
import LayoutAside from '~/components/LayoutAside.vue';

// На узких экранах боковое меню прячется в выдвижную панель
const menuOpen = ref(false);
const openMenu = () => {
  menuOpen.value = true;
};
const route = useRoute();
watch(() => route.fullPath, () => {
  menuOpen.value = false;
});
</script>

<template>
  <div class="bg-neutral-200 min-h-screen lg:flex">
    <div class="aside hidden lg:block w-[300px] shrink-0">
      <LayoutAside />
    </div>

    <div class="lg:hidden flex items-center gap-3 h-14 px-4 bg-gray-900 text-white">
      <UButton
        icon="i-lucide-menu"
        color="neutral"
        variant="ghost"
        class="text-white hover:bg-gray-800"
        aria-label="Открыть меню"
        @click="openMenu"
      />
      <NuxtLink to="/" class="font-bold tracking-wide">INFOMANIA</NuxtLink>
    </div>

    <USlideover
      v-model:open="menuOpen"
      side="left"
      title="Меню"
      :ui="{ content: 'max-w-[300px]', header: 'hidden', body: 'p-0 sm:p-0' }"
    >
      <template #body>
        <LayoutAside />
      </template>
    </USlideover>

    <div class="w-full min-w-0">
      <slot />
    </div>
  </div>
</template>

<style scoped></style>
