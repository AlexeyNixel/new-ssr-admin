<script setup lang="ts">
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import { useNotificationApi } from '~~/services/api/notification.api';
import { usePostApi } from '~~/services/api/post.api';
import { usePageApi } from '~~/services/api/page.api';
import { useTagApi } from '~~/services/api/tag.api';
import { useBookApi } from '~~/services/api/book.api';
import { useGameApi } from '~~/services/api/game.api';
import { useComicApi } from '~~/services/api/comic.api';
import { useEventApi } from '~~/services/api/event.api';
import { useSlideApi } from '~~/services/api/slide.api';
import { useClubApi } from '~~/services/api/club.api';
import { useDepartmentApi } from '~~/services/api/department.api';
import { useNavigationApi } from '~~/services/api/navigation.api';
import { useMapPointApi } from '~~/services/api/map-point.api';
import { useAuditLogApi } from '~~/services/api/audit-log.api';
import type { IEvent } from '~~/services/types/event.type';
import type { Notification } from '~~/services/types/notification.type';
import type { Post } from '~~/services/types/post.type';
import type { User } from '~~/services/types/user.type';
import type { AuditLogEntry } from '~~/services/types/audit-log.type';
import { NuxtLink } from '#components';

dayjs.extend(utc);

interface StatEntry {
  key: string;
  label: string;
  icon: string;
  link: string;
}

interface StatGroup {
  label: string;
  icon: string;
  color: string;
  iconWrap: string;
  topBorder: string;
  items: StatEntry[];
}

const statGroups: StatGroup[] = [
  {
    label: 'Контент',
    icon: 'i-heroicons-document-text',
    color: 'blue',
    iconWrap: 'bg-blue-100 text-blue-600',
    topBorder: 'border-t-blue-500',
    items: [
      { key: 'notification', label: 'Уведомления', icon: 'i-heroicons-bell', link: '/notification' },
      { key: 'post', label: 'Посты', icon: 'i-heroicons-newspaper', link: '/post' },
      { key: 'page', label: 'Страницы', icon: 'i-heroicons-newspaper', link: '/page' },
      { key: 'tag', label: 'Тэги', icon: 'i-mdi-tag-outline', link: '/tag' },
    ],
  },
  {
    label: 'Библиотека',
    icon: 'i-hugeicons-books-01',
    color: 'violet',
    iconWrap: 'bg-violet-100 text-violet-600',
    topBorder: 'border-t-violet-500',
    items: [
      { key: 'book', label: 'Книги', icon: 'i-heroicons:book-open', link: '/book' },
      { key: 'collection', label: 'Сборники книг', icon: 'i-hugeicons-books-01', link: '/collection' },
      { key: 'game', label: 'Игры', icon: 'i-heroicons-puzzle-piece', link: '/game' },
      { key: 'comic', label: 'Комиксы', icon: 'i-heroicons-book-open', link: '/comic' },
    ],
  },
  {
    label: 'Мероприятия',
    icon: 'i-solar-calendar-line-duotone',
    color: 'amber',
    iconWrap: 'bg-amber-100 text-amber-600',
    topBorder: 'border-t-amber-500',
    items: [
      { key: 'event', label: 'События', icon: 'i-solar-calendar-line-duotone', link: '/event' },
      { key: 'slide', label: 'Слайды', icon: 'i-material-symbols-image-outline', link: '/slide' },
      { key: 'club', label: 'Клубы', icon: 'iconoir:community', link: '/club' },
    ],
  },
  {
    label: 'Структура сайта',
    icon: 'i-heroicons-map-pin',
    color: 'emerald',
    iconWrap: 'bg-emerald-100 text-emerald-600',
    topBorder: 'border-t-emerald-500',
    items: [
      { key: 'department', label: 'Отделы', icon: 'i-heroicons-user-group', link: '/department' },
      { key: 'navigation', label: 'Навигация', icon: 'i-heroicons:bars-arrow-down', link: '/navigation' },
      { key: 'mapPoint', label: 'Точки на карте', icon: 'i-heroicons-map-pin', link: '/map-point' },
    ],
  },
];

const TYPE_LABELS: Record<Notification['type'], { label: string; color: 'error' | 'warning' | 'success' }> = {
  error: { label: 'Ошибка', color: 'error' },
  warning: { label: 'Предупреждение', color: 'warning' },
  success: { label: 'Успех', color: 'success' },
};

// Человекочитаемые названия сущностей для журнала изменений (GET /audit-log).
// Список типов — по спеке backend: docs/superpowers/specs/2026-09-22-audit-log-design.md
const ENTITY_LABELS: Record<string, string> = {
  Post: 'Новость',
  Department: 'Отдел',
  Tag: 'Тег',
  Achievement: 'Достижение',
  Book: 'Книга',
  BookCollection: 'Сборник книг',
  Club: 'Клуб',
  Event: 'Событие',
  MainSliderSlide: 'Слайд',
  MapPoint: 'Точка на карте',
  Notification: 'Уведомление',
  Page: 'Страница',
  Comic: 'Комикс',
  ComicGenre: 'Жанр комиксов',
  ComicSeries: 'Серия комиксов',
  Game: 'Игра',
  GameGenre: 'Жанр игр',
  GameSeries: 'Серия игр',
  NavigationItem: 'Пункт навигации',
};

const ACTION_LABELS: Record<AuditLogEntry['action'], { label: string; color: 'success' | 'primary' }> = {
  CREATE: { label: 'Создано', color: 'success' },
  UPDATE: { label: 'Изменено', color: 'primary' },
};

// Только те типы, для которых точно известен рабочий URL редактирования
// (см. docs/deep-links.md + /post/admin/:id). Page сюда не входит — бэкенд
// ищет её по slug, а в журнале есть только id.
const ENTITY_LINK_BUILDERS: Partial<Record<string, (id: string) => string>> = {
  Post: (id) => `/post/admin/${id}`,
  Department: (id) => `/department?editId=${id}`,
  Event: (id) => `/event?editId=${id}`,
  MainSliderSlide: (id) => `/slide?editId=${id}`,
  Notification: (id) => `/notification?editId=${id}`,
  MapPoint: (id) => `/map-point?editId=${id}`,
  Book: (id) => `/book?editId=${id}`,
  BookCollection: (id) => `/collection?editId=${id}`,
  NavigationItem: (id) => `/navigation?editId=${id}`,
  Club: (id) => `/club?editId=${id}`,
};

const auditLogLink = (entry: AuditLogEntry): string | null => {
  const builder = ENTITY_LINK_BUILDERS[entry.entityType];
  return builder ? builder(entry.entityId) : null;
};

const notificationApi = useNotificationApi();
const postApi = usePostApi();
const pageApi = usePageApi();
const tagApi = useTagApi();
const bookApi = useBookApi();
const gameApi = useGameApi();
const comicApi = useComicApi();
const eventApi = useEventApi();
const slideApi = useSlideApi();
const clubApi = useClubApi();
const departmentApi = useDepartmentApi();
const navigationApi = useNavigationApi();
const mapPointApi = useMapPointApi();
const auditLogApi = useAuditLogApi();

const cookies = useCookie<User | null>('user_data');
const greetingName = computed(() => cookies.value?.name || 'Модератор');
const today = dayjs().format('DD.MM.YYYY');

const counts = reactive<Record<string, number | null>>(
  Object.fromEntries(statGroups.flatMap((group) => group.items.map((item) => [item.key, null]))),
);

const loadCount = (key: string, request: Promise<{ meta?: { total: number } }>) => {
  request
    .then((res) => {
      counts[key] = res.meta?.total ?? 0;
    })
    .catch(() => {
      counts[key] = null;
    });
};

loadCount('notification', notificationApi.getAllNotifications({ limit: 1 }));
loadCount('post', postApi.getAllPosts({ limit: 1 }));
loadCount('page', pageApi.getAllPages({ limit: 1 }));
loadCount('tag', tagApi.getAllTags({ limit: 1 }));
loadCount('book', bookApi.getAllBook({ limit: 1 }));
loadCount('collection', bookApi.getAllCollections({ limit: 1 }));
loadCount('game', gameApi.getAllGames({ limit: 1 }));
loadCount('comic', comicApi.getAllComics({ limit: 1 }));
loadCount('event', eventApi.getAllEvents({ limit: 1 }));
loadCount('slide', slideApi.getAllSlides({ limit: 1 }));
loadCount('club', clubApi.getAllClubs({ limit: 1 }));
loadCount('department', departmentApi.getAllDepartments({ limit: 1 }));
loadCount('mapPoint', mapPointApi.getAllMapPoints({ limit: 1 }));

navigationApi
  .getAllNavigationWithoutTree()
  .then((items) => {
    counts.navigation = items.length;
  })
  .catch(() => {
    counts.navigation = null;
  });

const upcomingEvents = ref<IEvent[] | null>(null);
const activeNotifications = ref<Notification[] | null>(null);
const recentPosts = ref<Post[] | null>(null);
const recentAuditLog = ref<AuditLogEntry[] | null>(null);

const loadUpcomingEvents = async () => {
  try {
    const res = await eventApi.getAllEvents({ limit: 50, sortBy: 'eventTime' });
    const now = new Date().toISOString();
    upcomingEvents.value = (res.data ?? [])
      .filter((event) => !event.isDeleted && event.eventTime >= now)
      .sort((a, b) => a.eventTime.localeCompare(b.eventTime))
      .slice(0, 5);
  } catch {
    upcomingEvents.value = [];
  }
};

const loadActiveNotifications = async () => {
  try {
    const res = await notificationApi.getAllNotifications({ limit: 50 });
    const now = new Date().toISOString();
    activeNotifications.value = (res.data ?? [])
      .filter((notification) => !notification.isDeleted && notification.startTime <= now && now <= notification.endTime)
      .sort((a, b) => a.endTime.localeCompare(b.endTime))
      .slice(0, 5);
  } catch {
    activeNotifications.value = [];
  }
};

const loadRecentPosts = async () => {
  try {
    const res = await postApi.getAllPosts({ limit: 5, sortBy: 'createdAt', sortOrder: 'desc' });
    recentPosts.value = (res.data ?? [])
      .slice()
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, 5);
  } catch {
    recentPosts.value = [];
  }
};

const loadRecentAuditLog = async () => {
  try {
    const res = await auditLogApi.getAuditLog({ limit: 5 });
    recentAuditLog.value = res.data ?? [];
  } catch {
    recentAuditLog.value = [];
  }
};

loadUpcomingEvents();
loadActiveNotifications();
loadRecentPosts();
loadRecentAuditLog();

useHead({ title: 'НОМБ | Панель управления' });
</script>

<template>
  <div class="min-h-full p-6 bg-gray-50">
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-gray-900">Здравствуйте, {{ greetingName }}!</h1>
      <p class="text-gray-600 mt-1">{{ today }} · панель управления контентом библиотеки «НОМБ»</p>
    </div>

    <!-- Обзор контента -->
    <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
      <div
        v-for="group in statGroups"
        :key="group.label"
        :class="['bg-white rounded-lg shadow-sm border border-gray-200 border-t-4 p-4', group.topBorder]"
      >
        <div class="flex items-center gap-2 mb-3">
          <div :class="['p-1.5 rounded-lg', group.iconWrap]">
            <UIcon :name="group.icon" class="w-4 h-4" />
          </div>
          <h2 class="font-semibold text-gray-900">{{ group.label }}</h2>
        </div>
        <ul class="space-y-1">
          <li v-for="item in group.items" :key="item.key">
            <NuxtLink
              :to="item.link"
              class="flex items-center justify-between gap-2 px-2 py-1.5 rounded-md hover:bg-gray-100 transition-colors"
            >
              <span class="flex items-center gap-2 text-sm text-gray-700">
                <UIcon :name="item.icon" class="w-4 h-4 text-gray-400" />
                {{ item.label }}
              </span>
              <UBadge :color="counts[item.key] === null ? 'neutral' : group.color" variant="subtle">
                {{ counts[item.key] ?? '—' }}
              </UBadge>
            </NuxtLink>
          </li>
        </ul>
      </div>
    </div>

    <!-- Активность -->
    <div class="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-4">
      <!-- Ближайшие события -->
      <div class="bg-white rounded-lg shadow-sm border border-gray-200 border-t-4 border-t-amber-500 p-4">
        <div class="flex items-center justify-between mb-3">
          <div class="flex items-center gap-2">
            <div class="p-1.5 rounded-lg bg-amber-100 text-amber-600">
              <UIcon name="i-solar-calendar-line-duotone" class="w-4 h-4" />
            </div>
            <h2 class="font-semibold text-gray-900">Ближайшие события</h2>
          </div>
          <NuxtLink to="/event" class="text-xs text-amber-600 hover:underline">Все события</NuxtLink>
        </div>
        <p v-if="upcomingEvents === null" class="text-sm text-gray-400">Загрузка…</p>
        <p v-else-if="upcomingEvents.length === 0" class="text-sm text-gray-400">Нет ближайших событий</p>
        <ul v-else class="space-y-1">
          <li v-for="event in upcomingEvents" :key="event.id">
            <NuxtLink
              :to="`/event?editId=${event.id}`"
              class="block px-2 py-1.5 rounded-md hover:bg-gray-100 transition-colors"
            >
              <p class="text-sm font-medium text-gray-800 truncate">{{ event.title }}</p>
              <p class="text-xs text-gray-500">
                {{ dayjs(event.eventTime).utc().format('DD.MM.YYYY HH:mm') }}{{ event.place ? ` · ${event.place}` : '' }}
              </p>
            </NuxtLink>
          </li>
        </ul>
      </div>

      <!-- Активные уведомления -->
      <div class="bg-white rounded-lg shadow-sm border border-gray-200 border-t-4 border-t-blue-500 p-4">
        <div class="flex items-center justify-between mb-3">
          <div class="flex items-center gap-2">
            <div class="p-1.5 rounded-lg bg-blue-100 text-blue-600">
              <UIcon name="i-heroicons-bell" class="w-4 h-4" />
            </div>
            <h2 class="font-semibold text-gray-900">Активные уведомления</h2>
          </div>
          <NuxtLink to="/notification" class="text-xs text-blue-600 hover:underline">Все уведомления</NuxtLink>
        </div>
        <p v-if="activeNotifications === null" class="text-sm text-gray-400">Загрузка…</p>
        <p v-else-if="activeNotifications.length === 0" class="text-sm text-gray-400">Нет активных уведомлений</p>
        <ul v-else class="space-y-1">
          <li v-for="notification in activeNotifications" :key="notification.id">
            <NuxtLink
              :to="`/notification?editId=${notification.id}`"
              class="block px-2 py-1.5 rounded-md hover:bg-gray-100 transition-colors"
            >
              <div class="flex items-center gap-2">
                <UBadge :color="TYPE_LABELS[notification.type]?.color ?? 'neutral'" variant="subtle" size="sm">
                  {{ TYPE_LABELS[notification.type]?.label ?? notification.type }}
                </UBadge>
                <p class="text-sm font-medium text-gray-800 truncate">{{ notification.title }}</p>
              </div>
              <p class="text-xs text-gray-500 mt-0.5">до {{ dayjs(notification.endTime).format('DD.MM.YYYY HH:mm') }}</p>
            </NuxtLink>
          </li>
        </ul>
      </div>

      <!-- Последние публикации -->
      <div class="bg-white rounded-lg shadow-sm border border-gray-200 border-t-4 border-t-cyan-500 p-4">
        <div class="flex items-center justify-between mb-3">
          <div class="flex items-center gap-2">
            <div class="p-1.5 rounded-lg bg-cyan-100 text-cyan-600">
              <UIcon name="i-heroicons-newspaper" class="w-4 h-4" />
            </div>
            <h2 class="font-semibold text-gray-900">Последние публикации</h2>
          </div>
          <NuxtLink to="/post" class="text-xs text-cyan-600 hover:underline">Все посты</NuxtLink>
        </div>
        <p v-if="recentPosts === null" class="text-sm text-gray-400">Загрузка…</p>
        <p v-else-if="recentPosts.length === 0" class="text-sm text-gray-400">Публикаций пока нет</p>
        <ul v-else class="space-y-1">
          <li v-for="post in recentPosts" :key="post.id">
            <NuxtLink
              :to="`/post/admin/${post.id}`"
              class="block px-2 py-1.5 rounded-md hover:bg-gray-100 transition-colors"
            >
              <div class="flex items-center gap-2">
                <UBadge :color="post.isDeleted ? 'warning' : 'success'" variant="subtle" size="sm">
                  {{ post.isDeleted ? 'Скрыт' : 'Опубликован' }}
                </UBadge>
                <p class="text-sm font-medium text-gray-800 truncate">{{ post.title }}</p>
              </div>
              <p class="text-xs text-gray-500 mt-0.5">{{ dayjs(post.createdAt).format('DD.MM.YYYY HH:mm') }}</p>
            </NuxtLink>
          </li>
        </ul>
      </div>

      <!-- Последние изменения -->
      <div class="bg-white rounded-lg shadow-sm border border-gray-200 border-t-4 border-t-violet-500 p-4">
        <div class="flex items-center justify-between mb-3">
          <div class="flex items-center gap-2">
            <div class="p-1.5 rounded-lg bg-violet-100 text-violet-600">
              <UIcon name="i-heroicons-clock" class="w-4 h-4" />
            </div>
            <h2 class="font-semibold text-gray-900">Последние изменения</h2>
          </div>
        </div>
        <p v-if="recentAuditLog === null" class="text-sm text-gray-400">Загрузка…</p>
        <p v-else-if="recentAuditLog.length === 0" class="text-sm text-gray-400">Изменений пока нет</p>
        <ul v-else class="space-y-1">
          <li v-for="entry in recentAuditLog" :key="entry.id">
            <component
              :is="auditLogLink(entry) ? NuxtLink : 'div'"
              :to="auditLogLink(entry) ?? undefined"
              class="block px-2 py-1.5 rounded-md transition-colors"
              :class="auditLogLink(entry) ? 'hover:bg-gray-100' : ''"
            >
              <div class="flex items-center gap-2">
                <UBadge :color="ACTION_LABELS[entry.action]?.color ?? 'neutral'" variant="subtle" size="sm">
                  {{ ACTION_LABELS[entry.action]?.label ?? entry.action }}
                </UBadge>
                <p class="text-sm font-medium text-gray-800 truncate">
                  {{ ENTITY_LABELS[entry.entityType] ?? entry.entityType }}
                </p>
              </div>
              <p class="text-xs text-gray-500 mt-0.5">
                {{ dayjs(entry.createdAt).format('DD.MM.YYYY HH:mm') }} · {{ entry.user?.name || entry.user?.username || 'система' }}
              </p>
            </component>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<style scoped></style>
