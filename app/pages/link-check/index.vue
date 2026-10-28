<script setup lang="ts">
import { useLinkCheckApi } from '~~/services/api/link-check.api';
import type { BrokenLink, LinkCheckReport, LinkSource } from '~~/services/types/link-check.type';

const POLL_MS = 5000;

const toast = useToast();
const linkCheckApi = useLinkCheckApi();
const siteUrl = (useRuntimeConfig().public.siteUrl as string).replace(/\/+$/, '');

const report = ref<LinkCheckReport | null>(null);
const history = ref<LinkCheckReport[]>([]);
const loading = ref(true);
const starting = ref(false);
const search = ref('');
const severity = ref<'all' | 'broken' | 'warning'>('all');

const running = computed(() => report.value?.status === 'RUNNING');
const progress = computed(() =>
  report.value?.total ? Math.round((report.value.checked / report.value.total) * 100) : 0
);

const load = async () => {
  try {
    const [latest, list] = await Promise.all([linkCheckApi.latest(), linkCheckApi.history()]);
    report.value = latest;
    history.value = list;
  } catch {
    toast.add({ title: 'Не удалось загрузить отчёт', color: 'error' });
  } finally {
    loading.value = false;
  }
};

await load();

// Пока проверка идёт — обновляем прогресс
const { pause, resume } = useIntervalFn(load, POLL_MS, { immediate: false });
watch(running, (value) => (value ? resume() : pause()), { immediate: true });

const start = async () => {
  starting.value = true;
  try {
    report.value = await linkCheckApi.run();
    toast.add({ title: 'Проверка запущена', description: 'Можно уйти со страницы — она идёт на сервере' });
  } catch (error) {
    const message = (error as { data?: { message?: string } })?.data?.message;
    toast.add({ title: 'Не удалось запустить', description: message, color: 'error' });
    await load();
  } finally {
    starting.value = false;
  }
};

const results = computed(() => {
  const query = search.value.trim().toLowerCase();
  return (report.value?.results ?? []).filter(
    (link) =>
      (severity.value === 'all' || link.severity === severity.value) &&
      (!query ||
        link.url.toLowerCase().includes(query) ||
        link.sources.some((source) => source.title.toLowerCase().includes(query)))
  );
});
const warningCount = computed(() => (report.value?.results ?? []).filter((l) => l.severity === 'warning').length);

const severityItems = computed(() => [
  { label: `Все · ${report.value?.results?.length ?? 0}`, value: 'all' },
  { label: `Не открываются · ${report.value?.brokenCount ?? 0}`, value: 'broken' },
  { label: `Проверить вручную · ${warningCount.value}`, value: 'warning' },
]);

const statusText = (link: BrokenLink) => {
  if (link.status === 404 || link.status === 410) return `${link.status} — страницы нет`;
  if (link.status && link.status >= 500) return `${link.status} — ошибка сервера`;
  if (link.status === 403 || link.status === 401) return `${link.status} — сайт не пускает робота`;
  if (link.status === 429) return '429 — слишком много запросов';
  if (link.status) return String(link.status);
  return link.error || 'не отвечает';
};

/** Куда идти чинить: запись в админке или страница сайта */
const sourceLink = (source: LinkSource) =>
  source.type === 'Sitemap'
    ? { to: siteUrl + source.title, target: '_blank' }
    : { to: (source.id && auditEntityLink(source.type, source.id)) || undefined };

const sourceLabel = (source: LinkSource) =>
  source.type === 'Sitemap' ? 'Страница сайта' : auditEntityLabel(source.type);

const duration = (item: LinkCheckReport) => {
  if (!item.finishedAt) return '';
  const minutes = Math.round((new Date(item.finishedAt).getTime() - new Date(item.startedAt).getTime()) / 60000);
  return minutes < 1 ? 'меньше минуты' : `${minutes} мин`;
};

useHead({ title: 'НОМБ | Проверка ссылок' });
</script>

<template>
  <NuxtLayout
    v-model:search="search"
    name="table"
    title="Проверка ссылок"
    description="Страницы сайта и ссылки в текстах, которые не открываются. Автоматически — раз в неделю ночью"
    search-placeholder="Поиск по адресу или записи…"
  >
    <template #actions>
      <UButton icon="i-lucide-play" :loading="starting || running" :disabled="running" @click="start">
        <span class="hidden sm:inline">{{ running ? 'Идёт проверка' : 'Проверить сейчас' }}</span>
      </UButton>
    </template>

    <template #filters>
      <UTabs v-model="severity" :items="severityItems" :content="false" size="sm" />
    </template>

    <div class="divide-y divide-default">
      <!-- Сводка последней проверки -->
      <div class="p-4 sm:p-5">
        <USkeleton v-if="loading" class="h-16 w-full" />

        <p v-else-if="!report" class="text-sm text-muted">
          Проверок ещё не было. Нажмите «Проверить сейчас» — обход сайта займёт 15–30 минут.
        </p>

        <div v-else-if="running" class="space-y-2">
          <div class="flex flex-wrap items-baseline justify-between gap-2 text-sm">
            <span class="font-medium text-highlighted">
              {{ report.total ? 'Проверяем адреса…' : 'Собираем адреса из sitemap и текстов…' }}
            </span>
            <span v-if="report.total" class="tabular-nums text-muted">
              {{ report.checked.toLocaleString('ru-RU') }} из {{ report.total.toLocaleString('ru-RU') }} ·
              проблем пока {{ report.brokenCount }}
            </span>
          </div>
          <UProgress :model-value="report.total ? progress : null" />
        </div>

        <UAlert
          v-else-if="report.status === 'FAILED'"
          color="error"
          variant="subtle"
          icon="i-lucide-circle-alert"
          title="Проверка не завершилась"
          :description="report.error ?? undefined"
        />

        <div v-else class="flex flex-wrap items-center gap-x-8 gap-y-3">
          <div>
            <p class="text-2xl font-semibold tabular-nums" :class="report.brokenCount ? 'text-error' : 'text-success'">
              {{ report.brokenCount }}
            </p>
            <p class="text-xs text-muted">{{ plural(report.brokenCount, ['адрес не открывается', 'адреса не открываются', 'адресов не открываются']) }}</p>
          </div>
          <div>
            <p class="text-2xl font-semibold tabular-nums text-warning">{{ warningCount }}</p>
            <p class="text-xs text-muted">проверить вручную</p>
          </div>
          <div>
            <p class="text-2xl font-semibold tabular-nums text-highlighted">{{ report.checked.toLocaleString('ru-RU') }}</p>
            <p class="text-xs text-muted">адресов проверено</p>
          </div>
          <p class="text-sm text-muted sm:ms-auto">
            {{ formatDateTime(report.finishedAt) }} · {{ duration(report) }}
          </p>
        </div>
      </div>

      <!-- Список проблем -->
      <ListEmpty
        v-if="report && !running && report.status === 'DONE' && !results.length"
        :searching="!!search || severity !== 'all'"
        icon="i-lucide-badge-check"
        title="Битых ссылок не найдено"
        @reset="(search = ''), (severity = 'all')"
      />

      <ul v-else-if="results.length" class="divide-y divide-default">
        <li v-for="link in results" :key="link.url" class="flex flex-col gap-2 p-4 sm:flex-row sm:gap-4 sm:px-5">
          <div class="min-w-0 flex-1">
            <div class="flex items-start gap-2">
              <UIcon
                :name="link.severity === 'broken' ? 'i-lucide-circle-x' : 'i-lucide-circle-alert'"
                :class="['mt-0.5 size-4 shrink-0', link.severity === 'broken' ? 'text-error' : 'text-warning']"
              />
              <ULink :to="link.url" target="_blank" class="break-all text-sm font-medium text-highlighted hover:underline">
                {{ link.url.replace(/^https?:\/\//, '') }}
              </ULink>
            </div>
            <p class="ms-6 text-xs text-muted">{{ statusText(link) }}</p>
          </div>

          <ul class="ms-6 flex flex-col gap-1 sm:ms-0 sm:w-80 sm:shrink-0">
            <li v-for="(source, index) in link.sources" :key="index" class="text-sm">
              <span class="text-xs text-muted">{{ sourceLabel(source) }}:</span>
              <ULink
                v-if="sourceLink(source).to"
                v-bind="sourceLink(source)"
                class="ms-1 text-primary hover:underline"
              >
                {{ source.title }}
              </ULink>
              <span v-else class="ms-1">{{ source.title }}</span>
            </li>
          </ul>
        </li>
      </ul>

      <!-- История -->
      <details v-if="history.length > 1" class="p-4 sm:px-5">
        <summary class="cursor-pointer text-sm font-medium text-muted">Предыдущие проверки</summary>
        <ul class="mt-3 space-y-1 text-sm">
          <li v-for="item in history" :key="item.id" class="flex flex-wrap gap-x-3 tabular-nums">
            <span class="w-44 text-muted">{{ formatDateTime(item.startedAt) }}</span>
            <span v-if="item.status === 'DONE'">
              {{ item.brokenCount }} не открываются из {{ item.checked.toLocaleString('ru-RU') }}
            </span>
            <span v-else-if="item.status === 'RUNNING'" class="text-info">идёт</span>
            <span v-else class="text-error">не завершилась</span>
          </li>
        </ul>
      </details>
    </div>
  </NuxtLayout>
</template>
