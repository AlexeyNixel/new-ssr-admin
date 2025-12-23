<script setup lang="ts">
import UploadExhibition from '~/components/Ui/UploadExhibition.vue';

const navLinks = [
  {
    label: 'Посты',
    link: '/post',
    icon: 'i-heroicons-newspaper',
  },
  {
    label: 'Страницы',
    link: '/page',
    icon: 'i-heroicons-newspaper',
  },
  {
    label: 'Тэги',
    link: '/tag',
    icon: 'i-mdi-tag-outline',
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
    label: 'Сборники книг',
    link: '/collection',
    icon: 'i-hugeicons-books-01',
  },
  {
    label: 'Навигация',
    link: '/navigation',
    icon: 'i-heroicons:bars-arrow-down',
  },
];
const cookies = useCookie('user_data');
const authApi = useAuth();
const user = computed(() => {
  return {
    name: cookies.value?.name || '',
    email: cookies.value?.username,
    role: 'Администратор',
    avatar: 'i-heroicons-user-circle',
  };
});

const isAuth = ref(authApi.isAuthenticated);

const handleLogout = () => {
  authApi.clearAuth();
  navigateTo('/login');
};
</script>

<template>
  <div class="h-screen sticky top-0 bg-gray-900 text-white flex flex-col">
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

        <div
          v-if="$route.path.startsWith(link.link)"
          class="ml-auto w-2 h-2 bg-white rounded-full"
        />
      </NuxtLink>

      <UploadExhibition />
    </nav>
    <div v-if="isAuth" class="p-4 border-t border-gray-700">
      <div class="flex items-center gap-3 mb-4 p-3 rounded-lg bg-gray-800">
        <Icon :name="user.avatar" class="text-2xl text-gray-400" />
        <div class="flex-1 min-w-0">
          <p class="text-sm font-medium text-white truncate">{{ user.name }}</p>
          <p class="text-xs text-gray-400 truncate">{{ user.email }}</p>
          <p class="text-xs text-blue-400">{{ user.role }}</p>
        </div>
      </div>

      <UButton
        color="neutral"
        variant="outline"
        class="w-full justify-center cursor-pointer"
        @click="handleLogout"
      >
        <Icon name="i-heroicons-arrow-left-on-rectangle" class="text-lg mr-2" />
        Выйти
      </UButton>
    </div>
  </div>
</template>

<style scoped></style>
