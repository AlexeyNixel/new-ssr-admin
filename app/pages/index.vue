<script setup lang="ts">
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import { useNotificationApi } from '~~/services/api/notification.api';
import { usePostApi } from '~~/services/api/post.api';
import { useEventApi } from '~~/services/api/event.api';
import { useAuditLogApi } from '~~/services/api/audit-log.api';
import type { IEvent } from '~~/services/types/event.type';
import type { Notification } from '~~/services/types/notification.type';
import type { Post } from '~~/services/types/post.type';
import type { User } from '~~/services/types/user.type';
import type { AuditLogEntry } from '~~/services/types/audit-log.type';
import { EVENT_CATEGORIES } from '~/constants/eventCategories';
import { ModalsAdminNotification, NuxtLink } from '#components';

dayjs.extend(utc);

const TYPE_LABELS: Record<Notification['type'], { label: string; color: string }> = {
  error: { label: 'Ошибка', color: 'error' },
  warning: { label: 'Предупреждение', color: 'warning' },
  success: { label: 'Успех', color: 'success' },
  festive: { label: 'Праздничное', color: 'purple' },
};

const notificationApi = useNotificationApi();
const postApi = usePostApi();
const eventApi = useEventApi();
const auditLogApi = useAuditLogApi();

const cookies = useCookie<User | null>('user_data');
const { can, canPath } = useAccess();
const greetingName = computed(() => cookies.value?.name || 'Модератор');

// ---------- Быстрые действия ----------

const overlay = useOverlay();
const notificationModal = overlay.create(ModalsAdminNotification);

const createNotification = async () => {
  const result = await notificationModal.open().result;
  if (result) loadNotifications();
};

const quickActions = [
  { label: 'Новость', icon: 'i-heroicons-newspaper', to: '/post/admin' },
  { label: 'Событие', icon: 'i-solar-calendar-line-duotone', to: '/event/admin' },
  { label: 'Слайд', icon: 'i-material-symbols-image-outline', to: '/slide/admin' },
];

// ---------- Данные ----------

/*
 * Время событий хранится «наивно» в UTC-нотации (18:30 по городу → …T18:30:00.000Z),
 * поэтому «сейчас» для сравнения — местное время, записанное в той же нотации.
 */
const nowNaive = `${dayjs().format('YYYY-MM-DDTHH:mm:ss')}.000Z`;
const nowIso = new Date().toISOString();

const events = ref<IEvent[] | null>(null);
const notifications = ref<Notification[] | null>(null);
const posts = ref<Post[] | null>(null);
const auditLog = ref<AuditLogEntry[] | null>(null);

const loadEvents = async () => {
  try {
    // desc + isDeleted: свежие (в т.ч. будущие и скрытые) события идут первыми
    const res = await eventApi.getAllEvents({ isDeleted: true, limit: 100, sortBy: 'eventTime', sortOrder: 'desc' });
    events.value = res.data ?? [];
  } catch {
    events.value = [];
  }
};

const loadNotifications = async () => {
  try {
    const res = await notificationApi.getAllNotifications({ limit: 50 });
    notifications.value = res.data ?? [];
  } catch {
    notifications.value = [];
  }
};

const loadPosts = async () => {
  try {
    const res = await postApi.getAllPosts({
      isDeleted: true,
      include: 'preview',
      limit: 30,
      sortBy: 'createdAt',
      sortOrder: 'desc',
    });
    posts.value = res.data ?? [];
  } catch {
    posts.value = [];
  }
};

const loadAuditLog = async () => {
  try {
    const res = await auditLogApi.getAuditLog({ limit: 8 });
    auditLog.value = res.data ?? [];
  } catch {
    auditLog.value = [];
  }
};

loadEvents();
loadNotifications();
loadPosts();
if (can('audit-log')) loadAuditLog();

// ---------- Афиша на неделю ----------

const todayStartNaive = `${dayjs().format('YYYY-MM-DD')}T00:00:00.000Z`;

// С начала сегодняшнего дня: прошедшие сегодня события остаются в колонке «Сегодня»
const weekEvents = computed(() =>
  (events.value ?? [])
    .filter((event) => event.eventTime >= todayStartNaive)
    .sort((a, b) => a.eventTime.localeCompare(b.eventTime)),
);

const isPast = (event: IEvent) => event.eventTime < nowNaive;

const WEEK_DAYS = 7;
const weekdayFormat = new Intl.DateTimeFormat('ru-RU', { weekday: 'long' });
const dayMonthFormat = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long' });

const week = computed(() =>
  Array.from({ length: WEEK_DAYS }, (_, i) => {
    const day = dayjs().add(i, 'day');
    const key = day.format('YYYY-MM-DD');
    return {
      key,
      title: i === 0 ? 'Сегодня' : i === 1 ? 'Завтра' : weekdayFormat.format(day.toDate()),
      date: dayMonthFormat.format(day.toDate()),
      isToday: i === 0,
      isWeekend: day.day() === 0 || day.day() === 6,
      events: weekEvents.value.filter((event) => event.eventTime.slice(0, 10) === key),
    };
  }),
);

const weekTotal = computed(() => week.value.reduce((sum, day) => sum + day.events.length, 0));
const laterEvents = computed(() => weekEvents.value.length - weekTotal.value);

// Плитка события в цвете плаката на сайте; у «Встречи» плакат белый — рисуем рамкой
const POSTER_TEXT: Record<string, string> = {
  MASTER: '#3b2a05',
  MUSIC: '#ffffff',
  GAME: '#ffffff',
  TALK: 'var(--ui-text-highlighted)',
};

const posterStyle = (event: IEvent) => {
  const color = EVENT_CATEGORIES.find((category) => category.value === event.category)?.color;
  if (!color || !event.category) {
    return { background: 'var(--ui-bg-elevated)', color: 'var(--ui-text)', borderStyle: 'dashed' };
  }
  return { background: color, color: POSTER_TEXT[event.category], borderStyle: 'solid' };
};

const categoryLabel = (event: IEvent) =>
  EVENT_CATEGORIES.find((category) => category.value === event.category)?.label ?? 'Тип не указан';

const eventClock = (event: IEvent) => dayjs.utc(event.eventTime).format('HH:mm');

// ---------- Требует внимания ----------

interface AttentionItem {
  id: string;
  icon: string;
  tone: 'warning' | 'info';
  title: string;
  hint: string;
  to: string;
}

interface AttentionGroup {
  key: string;
  label: string;
  items: AttentionItem[];
}

const missingEventFields = (event: IEvent) => {
  const missing: string[] = [];
  if (!stripHtml(event.content)) missing.push('описание');
  if (!event.place) missing.push('место');
  if (!event.category) missing.push('тип');
  if (event.age == null) missing.push('возраст');
  return missing;
};

const DRAFT_FRESH_DAYS = 14;
const NOTIFICATION_EXPIRING_HOURS = 48;

const activeNotifications = computed(() =>
  (notifications.value ?? [])
    .filter((n) => !n.isDeleted && n.startTime <= nowIso && nowIso <= n.endTime)
    .sort((a, b) => a.endTime.localeCompare(b.endTime)),
);

const attentionGroups = computed<AttentionGroup[]>(() => {
  const eventItems: AttentionItem[] = [];
  for (const day of week.value) {
    for (const event of day.events) {
      if (isPast(event)) continue;
      const when = `${day.title}, ${eventClock(event)}`;
      if (event.isDeleted) {
        eventItems.push({
          id: `event-hidden-${event.id}`,
          icon: 'i-lucide-eye-off',
          tone: 'warning',
          title: event.title,
          hint: `${when} — скрыто с сайта`,
          to: `/event/admin/${event.id}`,
        });
        continue;
      }
      const missing = missingEventFields(event);
      if (missing.length) {
        eventItems.push({
          id: `event-missing-${event.id}`,
          icon: 'i-lucide-calendar-x',
          tone: 'warning',
          title: event.title,
          hint: `${when} — не заполнено: ${missing.join(', ')}`,
          to: `/event/admin/${event.id}`,
        });
      }
    }
  }

  const expiringBorder = dayjs().add(NOTIFICATION_EXPIRING_HOURS, 'hour').toISOString();
  const notificationItems: AttentionItem[] = activeNotifications.value
    .filter((notification) => notification.endTime <= expiringBorder)
    .map((notification) => ({
      id: `notification-${notification.id}`,
      icon: 'i-lucide-bell-ring',
      tone: 'info',
      title: notification.title,
      hint: `Снимется ${formatRelative(notification.endTime)} в ${dayjs(notification.endTime).format('HH:mm')}`,
      to: `/notification?editId=${notification.id}`,
    }));

  const draftBorder = dayjs().subtract(DRAFT_FRESH_DAYS, 'day').toISOString();
  const draftItems: AttentionItem[] = (posts.value ?? [])
    .filter((post) => post.isDeleted && (post.updatedAt ?? post.createdAt) >= draftBorder)
    .map((post) => ({
      id: `post-${post.id}`,
      icon: 'i-lucide-file-pen-line',
      tone: 'info',
      title: post.title || 'Без названия',
      hint: `Скрыта, правили ${formatRelative(post.updatedAt ?? post.createdAt)}`,
      to: `/post/admin/${post.id}`,
    }));

  return [
    { key: 'events', label: 'События недели', items: eventItems },
    { key: 'notifications', label: 'Скоро снимутся с сайта', items: notificationItems },
    { key: 'drafts', label: 'Неопубликованные новости', items: draftItems },
  ]
    // Сотруднику — только то, что он может исправить
    .map((group) => ({ ...group, items: group.items.filter((item) => canPath(item.to)) }))
    .filter((group) => group.items.length);
});

const attentionTotal = computed(() => attentionGroups.value.reduce((sum, group) => sum + group.items.length, 0));
const attentionLoading = computed(() => events.value === null || notifications.value === null || posts.value === null);

const TONE_CLASS: Record<AttentionItem['tone'], string> = {
  warning: 'bg-warning/10 text-warning',
  info: 'bg-info/10 text-info',
};

// ---------- На сайте сейчас ----------

// Мини-баннер в цветах уведомления на сайте + доля уже прошедшего срока показа
const BANNER_CLASS: Record<Notification['type'], { box: string; bar: string; icon: string; tint: string }> = {
  error: { box: 'bg-error/8 border-error/25', bar: 'bg-error', icon: 'i-lucide-octagon-alert', tint: 'text-error' },
  warning: { box: 'bg-warning/8 border-warning/25', bar: 'bg-warning', icon: 'i-lucide-triangle-alert', tint: 'text-warning' },
  success: { box: 'bg-success/8 border-success/25', bar: 'bg-success', icon: 'i-lucide-circle-check', tint: 'text-success' },
  festive: { box: 'bg-purple-500/8 border-purple-500/25', bar: 'bg-purple-500', icon: 'i-lucide-party-popper', tint: 'text-purple-500' },
};

const shownShare = (notification: Notification) => {
  const start = new Date(notification.startTime).getTime();
  const end = new Date(notification.endTime).getTime();
  if (end <= start) return 100;
  return Math.min(100, Math.max(0, ((Date.now() - start) / (end - start)) * 100));
};

// ---------- Новости и журнал ----------

const recentPosts = computed(() => (posts.value ?? []).slice(0, 5));

// Названия для журнала берём из уже загруженных списков — у записи журнала есть только id
const knownTitles = computed(() => {
  const titles = new Map<string, string>();
  for (const post of posts.value ?? []) titles.set(`Post:${post.id}`, post.title);
  for (const event of events.value ?? []) titles.set(`Event:${event.id}`, event.title);
  for (const notification of notifications.value ?? []) titles.set(`Notification:${notification.id}`, notification.title);
  return titles;
});

const auditTitle = (entry: AuditLogEntry) =>
  entry.entityTitle ?? knownTitles.value.get(`${entry.entityType}:${entry.entityId}`);

const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

const auditDays = computed(() => {
  const groups: { key: string; label: string; entries: AuditLogEntry[] }[] = [];
  for (const entry of auditLog.value ?? []) {
    const key = dayjs(entry.createdAt).format('YYYY-MM-DD');
    let group = groups.find((g) => g.key === key);
    if (!group) {
      const label =
        key === dayjs().format('YYYY-MM-DD')
          ? 'Сегодня'
          : key === dayjs().subtract(1, 'day').format('YYYY-MM-DD')
            ? 'Вчера'
            : dayMonthFormat.format(new Date(entry.createdAt));
      group = { key, label, entries: [] };
      groups.push(group);
    }
    group.entries.push(entry);
  }
  return groups;
});

const headerDate = capitalize(
  new Intl.DateTimeFormat('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date()),
);

useHead({ title: 'НОМБ | Панель управления' });
</script>


<template>
  <div class="min-h-full bg-gray-50 p-4 sm:p-6 space-y-5">
    <!-- Шапка -->
    <header class="flex flex-wrap items-end justify-between gap-4">
      <div>
        <p class="text-sm text-muted">{{ headerDate }}</p>
        <h1 class="!mb-0 !text-2xl sm:!text-3xl text-highlighted">Здравствуйте, {{ greetingName }}!</h1>
      </div>
      <div class="flex flex-wrap gap-2">
        <UButton v-if="can('posts')" to="/post/admin" icon="i-lucide-plus" size="lg">Новость</UButton>
        <UButton
          v-for="action in quickActions.slice(1).filter((a) => canPath(a.to))"
          :key="action.to"
          :to="action.to"
          :icon="action.icon"
          size="lg"
          color="neutral"
          variant="outline"
          class="bg-default"
        >
          {{ action.label }}
        </UButton>
        <UButton
          v-if="can('notifications')"
          icon="i-heroicons-bell"
          size="lg"
          color="neutral"
          variant="outline"
          class="bg-default"
          @click="createNotification"
        >
          Уведомление
        </UButton>
      </div>
    </header>

    <!-- Внимание + уведомления -->
    <div class="grid grid-cols-1 xl:grid-cols-3 gap-5 items-start">
      <section class="xl:col-span-2 rounded-2xl bg-default ring-1 ring-default">
        <div class="flex items-center gap-2 px-5 pt-4 pb-3">
          <h2 class="!mb-0 !text-base !font-semibold text-highlighted">Требует внимания</h2>
          <span
            v-if="!attentionLoading && attentionTotal"
            class="rounded-full bg-warning px-2 text-xs font-semibold leading-5 text-white tabular-nums"
          >
            {{ attentionTotal }}
          </span>
        </div>

        <div v-if="attentionLoading" class="space-y-2 px-5 pb-5">
          <USkeleton v-for="i in 3" :key="i" class="h-12 w-full" />
        </div>

        <div v-else-if="!attentionTotal" class="mx-5 mb-5 flex items-center gap-3 rounded-xl bg-success/10 px-4 py-3">
          <UIcon name="i-lucide-circle-check" class="size-6 shrink-0 text-success" />
          <div>
            <p class="text-sm font-medium text-highlighted">Всё в порядке</p>
            <p class="text-xs text-muted">События недели заполнены, черновиков и истекающих уведомлений нет.</p>
          </div>
        </div>

        <div v-else class="pb-2">
          <div v-for="group in attentionGroups" :key="group.key" class="border-t border-default first:border-t-0">
            <p class="px-5 pt-3 pb-1 text-xs font-medium text-muted">
              {{ group.label }} <span class="text-dimmed tabular-nums">{{ group.items.length }}</span>
            </p>
            <ul class="px-2 pb-2">
              <li v-for="item in group.items" :key="item.id">
                <NuxtLink
                  :to="item.to"
                  class="group flex items-center gap-3 rounded-xl px-3 py-2 hover:bg-elevated focus-visible:outline-2 focus-visible:outline-primary"
                >
                  <span :class="['flex size-9 shrink-0 items-center justify-center rounded-lg', TONE_CLASS[item.tone]]">
                    <UIcon :name="item.icon" class="size-[18px]" />
                  </span>
                  <span class="min-w-0 flex-1">
                    <span class="block truncate text-sm font-medium text-highlighted">{{ item.title }}</span>
                    <span class="block truncate text-xs text-muted">{{ item.hint }}</span>
                  </span>
                  <span
                    class="hidden sm:inline text-xs font-medium text-primary opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100"
                  >
                    Открыть
                  </span>
                </NuxtLink>
              </li>
            </ul>
          </div>
        </div>
      </section>

      <!-- На сайте сейчас -->
      <section v-if="can('notifications')" class="rounded-2xl bg-default ring-1 ring-default p-5">
        <div class="mb-3 flex items-center justify-between gap-2">
          <h2 class="!mb-0 !text-base !font-semibold text-highlighted">На сайте сейчас</h2>
          <UButton to="/notification" variant="link" size="sm" class="px-0">Все уведомления</UButton>
        </div>
        <USkeleton v-if="notifications === null" class="h-16 w-full" />
        <div v-else-if="!activeNotifications.length" class="rounded-xl border border-dashed border-accented px-4 py-5 text-center">
          <p class="text-sm text-muted">Уведомлений на сайте нет</p>
          <UButton variant="link" size="sm" icon="i-lucide-plus" class="mt-1" @click="createNotification">Добавить</UButton>
        </div>
        <ul v-else class="space-y-2">
          <li v-for="notification in activeNotifications" :key="notification.id">
            <NuxtLink
              :to="`/notification?editId=${notification.id}`"
              :class="['block overflow-hidden rounded-xl border transition-shadow hover:shadow-sm', BANNER_CLASS[notification.type]?.box]"
              :title="TYPE_LABELS[notification.type]?.label"
            >
              <div class="flex gap-3 px-3 pt-3 pb-2">
                <UIcon
                  :name="BANNER_CLASS[notification.type]?.icon ?? 'i-lucide-bell'"
                  :class="['mt-0.5 size-5 shrink-0', BANNER_CLASS[notification.type]?.tint]"
                />
                <div class="min-w-0">
                  <p class="text-sm font-medium leading-snug text-highlighted line-clamp-2">{{ notification.title }}</p>
                  <p class="mt-1 text-xs text-muted">
                    До {{ dayjs(notification.endTime).format('D.MM, HH:mm') }}, снимется {{ formatRelative(notification.endTime) }}
                  </p>
                </div>
              </div>
              <div class="h-1 bg-black/5">
                <div :class="['h-full', BANNER_CLASS[notification.type]?.bar]" :style="{ width: `${shownShare(notification)}%` }" />
              </div>
            </NuxtLink>
          </li>
        </ul>
      </section>
    </div>

    <!-- Афиша на неделю -->
    <section v-if="can('events')" class="rounded-2xl bg-default ring-1 ring-default p-5">
      <div class="mb-4 flex flex-wrap items-center justify-between gap-x-6 gap-y-2">
        <div class="flex items-baseline gap-2">
          <h2 class="!mb-0 !text-base !font-semibold text-highlighted">Афиша на неделю</h2>
          <span v-if="events !== null" class="text-sm text-muted tabular-nums">
            {{ weekTotal }} {{ plural(weekTotal, ['событие', 'события', 'событий']) }}
          </span>
        </div>
        <div class="flex flex-wrap items-center gap-x-4 gap-y-1">
          <span v-for="category in EVENT_CATEGORIES" :key="category.value" class="flex items-center gap-1.5 text-xs text-muted">
            <span class="size-2.5 rounded-full ring-1 ring-black/15" :style="{ background: category.color }" />
            {{ category.label }}
          </span>
          <UButton to="/event" variant="link" size="sm" class="px-0">Все события</UButton>
        </div>
      </div>

      <div v-if="events === null" class="grid grid-cols-7 gap-3">
        <USkeleton v-for="i in 7" :key="i" class="h-40" />
      </div>
      <div v-else class="-mx-5 overflow-x-auto px-5 pb-1">
        <div class="grid min-w-[52rem] grid-cols-7 gap-2.5">
          <div v-for="day in week" :key="day.key" class="flex min-w-0 flex-col">
            <div :class="['mb-2 rounded-lg px-2.5 py-1.5', day.isToday ? 'bg-primary text-inverted' : 'bg-elevated']">
              <p :class="['text-sm font-semibold capitalize', day.isToday ? '' : day.isWeekend ? 'text-error' : 'text-highlighted']">
                {{ day.title }}
              </p>
              <p :class="['text-xs', day.isToday ? 'opacity-80' : 'text-muted']">{{ day.date }}</p>
            </div>

            <div class="flex flex-1 flex-col gap-2">
              <NuxtLink
                v-for="event in day.events"
                :key="event.id"
                :to="`/event/admin/${event.id}`"
                :style="posterStyle(event)"
                :class="[
                  'block rounded-xl border border-black/10 p-2.5 transition hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-2 focus-visible:outline-primary motion-reduce:transition-none motion-reduce:hover:translate-y-0',
                  event.isDeleted || isPast(event) ? 'opacity-55' : '',
                ]"
                :title="event.isDeleted ? `${categoryLabel(event)}, скрыто с сайта` : categoryLabel(event)"
              >
                <div class="flex items-center justify-between gap-1">
                  <span class="text-base font-bold tabular-nums leading-none">{{ eventClock(event) }}</span>
                  <UIcon v-if="event.isDeleted" name="i-lucide-eye-off" class="size-4" />
                </div>
                <p class="mt-1.5 text-[13px] font-medium leading-snug line-clamp-3">{{ event.title }}</p>
                <p v-if="event.place" class="mt-1 truncate text-[11px] opacity-75">{{ event.place }}</p>
              </NuxtLink>

              <NuxtLink
                v-if="!day.events.length"
                to="/event/admin"
                class="group flex min-h-24 flex-1 items-center justify-center rounded-xl border border-dashed border-default text-xs text-dimmed hover:border-primary hover:text-primary"
              >
                <span class="group-hover:hidden">Нет событий</span>
                <span class="hidden items-center gap-1 group-hover:flex">
                  <UIcon name="i-lucide-plus" class="size-3.5" />
                  Добавить
                </span>
              </NuxtLink>
            </div>
          </div>
        </div>
      </div>
      <p v-if="laterEvents > 0" class="mt-3 text-xs text-muted">
        Дальше запланировано ещё {{ laterEvents }} {{ plural(laterEvents, ['событие', 'события', 'событий']) }}.
      </p>
    </section>

    <!-- Новости + журнал -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
      <section v-if="can('posts')" class="rounded-2xl bg-default ring-1 ring-default p-5">
        <div class="mb-3 flex items-center justify-between gap-2">
          <h2 class="!mb-0 !text-base !font-semibold text-highlighted">Последние новости</h2>
          <UButton to="/post" variant="link" size="sm" class="px-0">Все новости</UButton>
        </div>
        <div v-if="posts === null" class="space-y-2">
          <USkeleton v-for="i in 4" :key="i" class="h-14 w-full" />
        </div>
        <p v-else-if="!recentPosts.length" class="text-sm text-muted">Новостей пока нет</p>
        <ul v-else class="-mx-2">
          <li v-for="post in recentPosts" :key="post.id">
            <NuxtLink
              :to="`/post/admin/${post.id}`"
              class="flex items-center gap-3 rounded-xl px-2 py-2 hover:bg-elevated focus-visible:outline-2 focus-visible:outline-primary"
            >
              <ListThumb :path="post.preview?.path" icon="i-heroicons-newspaper" aspect="4 / 3" width="4rem" />
              <div class="min-w-0 flex-1">
                <p class="text-sm font-medium leading-snug text-highlighted line-clamp-2">{{ post.title }}</p>
                <p class="mt-0.5 flex items-center gap-1.5 text-xs text-muted">
                  <template v-if="!post.isDeleted && post.publishedAt > nowIso">
                    <UIcon name="i-lucide-clock" class="size-3 text-info" />
                    Запланирована на {{ dayjs(post.publishedAt).format('D.MM, HH:mm') }}
                  </template>
                  <template v-else>
                    <span :class="['size-1.5 rounded-full', post.isDeleted ? 'bg-warning' : 'bg-success']" />
                    {{ post.isDeleted ? 'Скрыта' : 'Опубликована' }}, {{ formatRelative(post.createdAt) }}
                  </template>
                </p>
              </div>
            </NuxtLink>
          </li>
        </ul>
      </section>

      <section v-if="can('audit-log')" class="rounded-2xl bg-default ring-1 ring-default p-5">
        <div class="mb-3 flex items-center justify-between gap-2">
          <h2 class="!mb-0 !text-base !font-semibold text-highlighted">Последние изменения</h2>
          <UButton to="/audit-log" variant="link" size="sm" trailing-icon="i-lucide-arrow-right" class="px-0">
            Весь журнал
          </UButton>
        </div>
        <div v-if="auditLog === null" class="space-y-2">
          <USkeleton v-for="i in 4" :key="i" class="h-10 w-full" />
        </div>
        <p v-else-if="!auditLog.length" class="text-sm text-muted">Изменений пока нет</p>
        <div v-else class="space-y-3">
          <div v-for="day in auditDays" :key="day.key">
            <p class="mb-1 text-xs font-medium text-muted">{{ day.label }}</p>
            <ul class="-mx-2">
              <li v-for="entry in day.entries" :key="entry.id">
                <component
                  :is="auditLogLink(entry) ? NuxtLink : 'div'"
                  :to="auditLogLink(entry) ?? undefined"
                  :class="[
                    'flex items-start gap-3 rounded-xl px-2 py-1.5',
                    auditLogLink(entry) ? 'hover:bg-elevated focus-visible:outline-2 focus-visible:outline-primary' : '',
                  ]"
                >
                  <UAvatar :alt="auditAuthor(entry)" size="sm" class="mt-0.5" />
                  <div class="min-w-0 flex-1">
                    <p class="text-sm leading-snug text-default">
                      <span class="font-medium text-highlighted">{{ auditAuthor(entry) }}</span>
                      · {{ AUDIT_ACTION_LABELS[entry.action]?.label.toLowerCase() ?? entry.action }}:
                      {{ auditEntityLabel(entry.entityType).toLowerCase() }}
                      <span v-if="auditTitle(entry)" class="font-medium text-highlighted">«{{ auditTitle(entry) }}»</span>
                    </p>
                    <p class="text-xs text-dimmed tabular-nums">{{ dayjs(entry.createdAt).format('HH:mm') }}</p>
                  </div>
                </component>
              </li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>
