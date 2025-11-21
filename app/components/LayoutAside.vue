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
  {
    label: 'Слайды',
    link: '/slide',
    icon: 'i-material-symbols-image-outline',
  },
  {
    label: 'События',
    link: '/event',
    icon: 'i-solar-calendar-line-duotone',
  },
  {
    label: 'Книги',
    link: '/book',
    icon: 'i-heroicons:book-open',
  },
  {
    label: 'Навигация',
    link: '/navigation',
    icon: 'i-heroicons:bars-arrow-down',
  },
];
const cookies = useCookie('user_data');
const user = computed(() => {
  return {
    name: cookies.value?.name || '',
    email: cookies.value?.username,
    role: 'Администратор',
    avatar: 'i-heroicons-user-circle',
  };
});

const handleLogout = () => {
  console.log('Logout clicked');
  // Логика выхода
};
const activeLink = ref('');
</script>

<template>
  <div class="h-screen sticky top-0 bg-gray-900 text-white flex flex-col">
    <!-- Логотип -->
    <div class="p-6 border-b border-gray-700">
      <NuxtLink to="/" class="flex items-center gap-3 group">
        <div
          class="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center"
        >
          <Icon name="i-heroicons-cube" class="text-xl text-white" />
        </div>
        <div>
          <h1 class="text-xl font-bold text-white">INFOMANIA</h1>
          <p class="text-xs text-gray-400">Админ панель</p>
        </div>
      </NuxtLink>
    </div>

    <!-- Навигация -->
    <nav class="flex-1 p-4 space-y-1">
      <NuxtLink
        v-for="link in navLinks"
        :key="link.link"
        class="flex items-center gap-3 p-3 rounded-lg transition-colors duration-200 group"
        :class="[
          $route.path.startsWith(link.link)
            ? 'bg-blue-600 text-white shadow-sm'
            : 'text-gray-300 hover:bg-gray-800 hover:text-white',
        ]"
        :to="link.link"
      >
        <Icon
          :name="link.icon"
          class="text-xl"
          :class="[
            $route.path.startsWith(link.link)
              ? 'text-white'
              : 'text-gray-400 group-hover:text-white',
          ]"
        />
        <span class="font-medium">{{ link.label }}</span>

        <!-- Индикатор активного пункта -->
        <div
          v-if="$route.path.startsWith(link.link)"
          class="ml-auto w-2 h-2 bg-white rounded-full"
        />
      </NuxtLink>
    </nav>

    <!-- Пользователь и выход -->
    <div class="p-4 border-t border-gray-700">
      <div class="flex items-center gap-3 mb-4 p-3 rounded-lg bg-gray-800">
        <Icon :name="user.avatar" class="text-2xl text-gray-400" />
        <div class="flex-1 min-w-0">
          <p class="text-sm font-medium text-white truncate">{{ user.name }}</p>
          <p class="text-xs text-gray-400 truncate">{{ user.email }}</p>
          <p class="text-xs text-blue-400">{{ user.role }}</p>
        </div>
      </div>

      <UButton
        color="gray"
        variant="outline"
        class="w-full justify-center"
        @click="handleLogout"
      >
        <Icon name="i-heroicons-arrow-left-on-rectangle" class="text-lg mr-2" />
        Выйти
      </UButton>
    </div>
  </div>
</template>

<style scoped>
@import '~/assets/css/main.css';
.router-link-active {
  @apply bg-white/10 shadow-lg shadow-blue-500/20 border border-white/20;
}

/* Плавные переходы для всех интерактивных элементов */
nav a {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Улучшение производительности анимаций */
* {
  transform: translateZ(0);
  backface-visibility: hidden;
  perspective: 1000;
}
</style>
