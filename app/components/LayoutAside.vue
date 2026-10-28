<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui';
import type { User } from '~~/services/types/user.type';

interface NavLink {
  label: string;
  link: string;
  icon: string;
  /** Только для управляющих пользователями (slip, mgairat) */
  managersOnly?: boolean;
}

interface NavGroup {
  label: string;
  icon: string;
  items: NavLink[];
}

const navGroups: NavGroup[] = [
  {
    label: 'Контент',
    icon: 'i-heroicons-document-text',
    items: [
      {
        label: 'Уведомления',
        link: '/notification',
        icon: 'i-heroicons-newspaper',
      },
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
        label: 'Выставки',
        link: '/exhibition',
        icon: 'i-lucide-gallery-horizontal',
      },
      {
        label: 'Медиатека',
        link: '/media',
        icon: 'i-lucide-images',
      },
    ],
  },
  {
    label: 'Библиотека',
    icon: 'i-hugeicons-books-01',
    items: [
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
        label: 'Игры',
        link: '/game',
        icon: 'i-heroicons-puzzle-piece',
      },
      {
        label: 'Комиксы',
        link: '/comic',
        icon: 'i-heroicons-book-open',
      },
    ],
  },
  {
    label: 'Мероприятия',
    icon: 'i-solar-calendar-line-duotone',
    items: [
      {
        label: 'События',
        link: '/event',
        icon: 'i-solar-calendar-line-duotone',
      },
      {
        label: 'Слайды',
        link: '/slide',
        icon: 'i-material-symbols-image-outline',
      },
      {
        label: 'Клубы',
        link: '/club',
        icon: 'iconoir:community',
      },
    ],
  },
  {
    label: 'Структура сайта',
    icon: 'i-heroicons-map-pin',
    items: [
      {
        label: 'Отделы',
        link: '/department',
        icon: 'i-heroicons-user-group',
      },
      {
        label: 'Навигация',
        link: '/navigation',
        icon: 'i-heroicons:bars-arrow-down',
      },
      {
        label: 'Точки на карте',
        link: '/map-point',
        icon: 'i-heroicons-map-pin',
      },
    ],
  },
  {
    label: 'Инструменты',
    icon: 'i-lucide-wrench',
    items: [
      {
        label: 'Короткие ссылки',
        link: '/short-link',
        icon: 'i-lucide-link',
      },
      {
        label: 'Проверка ссылок',
        link: '/link-check',
        icon: 'i-lucide-link-2-off',
      },
      {
        label: 'Журнал изменений',
        link: '/audit-log',
        icon: 'i-lucide-history',
      },
      {
        label: 'Пользователи',
        link: '/user',
        icon: 'i-lucide-users',
        managersOnly: true,
      },
    ],
  },
];

const route = useRoute();
const siteUrl = useRuntimeConfig().public.siteUrl as string;

const cookies = useCookie<User | null>('user_data');
const { canPath } = useAccess();

const navItems = computed<NavigationMenuItem[]>(() =>
  navGroups.map((group) => {
    const visible = group.items.filter((item) =>
      item.managersOnly ? cookies.value?.canManageUsers : canPath(item.link)
    );
    const children = visible.map((item) => {
      const active = route.path.startsWith(item.link);
      return {
        label: item.label,
        to: item.link,
        icon: item.icon,
        active,
        ui: active ? { childLink: 'before:bg-primary' } : undefined,
      };
    });

    return {
      label: group.label,
      icon: group.icon,
      defaultOpen: children.some((child) => child.active),
      children,
    };
  }).filter((group) => group.children.length),
);

const authApi = useAuth();
const user = computed(() => {
  return {
    name: cookies.value?.name || '',
    email: cookies.value?.username,
    role: cookies.value?.canManageUsers ? 'Администратор' : 'Сотрудник',
    avatar: 'i-heroicons-user-circle',
  };
});

const isAuth = ref(authApi.isAuthenticated);
const { openCount, openReport } = useFeedback();

const handleLogout = async () => {
  await authApi.clearAuth();
  navigateTo('/login');
};
</script>

<template>
  <div class="dark h-screen sticky top-0 bg-gray-900 text-white flex flex-col">
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

      <!-- Переход на публичный сайт: в новой вкладке, чтобы админка осталась открытой -->
      <UButton
        :to="siteUrl"
        target="_blank"
        rel="noopener"
        color="neutral"
        variant="soft"
        icon="i-lucide-globe"
        trailing-icon="i-lucide-arrow-up-right"
        block
        class="mt-4 cursor-pointer"
        :ui="{ trailingIcon: 'ms-auto size-4 text-gray-400' }"
      >
        Перейти на сайт
      </UButton>
    </div>

    <!-- Навигация -->
    <nav class="flex-1 overflow-y-auto p-4">
      <UNavigationMenu
        :items="navItems"
        orientation="vertical"
        color="primary"
        class="w-full"
      />
    </nav>

    <!-- Ошибки и пожелания: чип — сколько обращений ещё не выполнено -->
    <div v-if="isAuth" class="px-4 pt-3 space-y-1 border-t border-gray-700">
      <UButton
        to="/feedback"
        color="neutral"
        variant="ghost"
        icon="i-lucide-list-checks"
        block
        class="justify-start cursor-pointer"
        :class="route.path.startsWith('/feedback') ? 'bg-gray-800' : ''"
      >
        Ошибки и пожелания
        <template #trailing>
          <UBadge
            v-if="openCount"
            :label="openCount"
            color="warning"
            variant="solid"
            size="sm"
            class="ms-auto tabular-nums"
            :title="`Не выполнено: ${openCount}`"
          />
        </template>
      </UButton>
      <UButton
        color="warning"
        variant="soft"
        icon="i-lucide-message-square-warning"
        block
        class="justify-start cursor-pointer"
        @click="openReport()"
      >
        Сообщить об ошибке
      </UButton>
    </div>
    <div v-if="isAuth" class="p-4">
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
