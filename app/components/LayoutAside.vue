<script setup lang="ts">
const navLinks = [
  {
    label: 'Посты',
    link: '/post',
    icon: 'i-heroicons-newspaper',
  },
  {
    label: 'Отделы',
    link: '/department',
    icon: 'i-heroicons-user-group',
  },
];
</script>

<template>
  <div class="h-full bg-[#202531] text-white flex flex-col px-4">
    <NuxtLink class="text-center" to="/">
      <h1 class="text-4xl font-bold">INFOMANIA</h1>
    </NuxtLink>

    <nav class="flex flex-col text-lg font-bold">
      <NuxtLink
        v-for="link in navLinks"
        :key="link.link"
        class="flex items-center gap-3"
        :to="link.link"
      >
        <Icon class="text-3xl" :name="link.icon" />
        <span> {{ link.label }}</span>
      </NuxtLink>
    </nav>
  </div>
</template>

<style scoped></style>
