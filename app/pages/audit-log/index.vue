<script setup lang="ts">
import dayjs from 'dayjs';
import { NuxtLink } from '#components';
import { useAuditLogApi } from '~~/services/api/audit-log.api';
import type { AuditLogAuthor, AuditLogEntry } from '~~/services/types/audit-log.type';
import type { Meta } from '~~/services/api';

const PAGE_SIZE = 50;

const toast = useToast();
const auditLogApi = useAuditLogApi();

// Фильтры живут в URL: из журнала уходят в запись и возвращаются «Назад»
const { page, filters } = useListQuery({ user: 'all', type: 'all', period: 'all' });

const entries = ref<AuditLogEntry[]>([]);
const meta = ref<Meta>();
const loading = ref(false);
const authors = ref<AuditLogAuthor[]>([]);

const PERIODS = [
  { label: 'За всё время', value: 'all' },
  { label: 'Сегодня', value: 'today' },
  { label: 'За неделю', value: 'week' },
  { label: 'За месяц', value: 'month' },
];

const periodFrom = (period: string) => {
  if (period === 'today') return dayjs().startOf('day').toISOString();
  if (period === 'week') return dayjs().subtract(7, 'day').startOf('day').toISOString();
  if (period === 'month') return dayjs().subtract(1, 'month').startOf('day').toISOString();
  return undefined;
};

const fetchData = async () => {
  loading.value = true;
  try {
    const res = await auditLogApi.getAuditLog({
      page: page.value,
      limit: PAGE_SIZE,
      userId: filters.user !== 'all' ? filters.user : undefined,
      entityType: filters.type !== 'all' ? filters.type : undefined,
      from: periodFrom(filters.period),
    });
    entries.value = res.data ?? [];
    meta.value = res.meta;
  } catch {
    toast.add({ title: 'Не удалось загрузить журнал', color: 'error' });
  } finally {
    loading.value = false;
  }
};

auditLogApi
  .getAuthors()
  .then((list) => (authors.value = list))
  .catch(() => undefined);

await fetchData();
watch([page, () => ({ ...filters })], fetchData);

const userItems = computed(() => [
  { label: 'Все сотрудники', value: 'all' },
  ...authors.value.map((author) => ({
    label: `${author.name || author.username} · ${author.changes}`,
    value: author.id,
  })),
]);

const typeItems = computed(() => [
  { label: 'Все разделы', value: 'all' },
  ...Object.entries(AUDIT_ENTITY_LABELS)
    .map(([value, label]) => ({ label, value }))
    .sort((a, b) => a.label.localeCompare(b.label, 'ru')),
]);

const days = computed(() => {
  const groups: { key: string; label: string; entries: AuditLogEntry[] }[] = [];
  for (const entry of entries.value) {
    const key = dayjs(entry.createdAt).format('YYYY-MM-DD');
    let group = groups.find((g) => g.key === key);
    if (!group) {
      const label =
        key === dayjs().format('YYYY-MM-DD')
          ? 'Сегодня'
          : key === dayjs().subtract(1, 'day').format('YYYY-MM-DD')
            ? 'Вчера'
            : formatDate(entry.createdAt);
      group = { key, label, entries: [] };
      groups.push(group);
    }
    group.entries.push(entry);
  }
  return groups;
});

const hasFilters = computed(() => filters.user !== 'all' || filters.type !== 'all' || filters.period !== 'all');
const resetFilters = () => {
  filters.user = 'all';
  filters.type = 'all';
  filters.period = 'all';
};

useHead({ title: 'НОМБ | Журнал изменений' });
</script>

<template>
  <NuxtLayout
    v-model="page"
    name="table"
    title="Журнал изменений"
    description="Кто, когда и что создал или изменил в админке"
    :meta="meta"
    :loading="loading"
  >
    <template #filters>
      <div class="flex flex-wrap gap-2">
        <USelect v-model="filters.user" :items="userItems" class="w-56" aria-label="Сотрудник" />
        <USelect v-model="filters.type" :items="typeItems" class="w-48" aria-label="Раздел" />
        <USelect v-model="filters.period" :items="PERIODS" class="w-40" aria-label="Период" />
      </div>
    </template>

    <div class="p-4 sm:p-5">
      <div v-if="loading && !entries.length" class="space-y-2">
        <USkeleton v-for="i in 8" :key="i" class="h-12 w-full" />
      </div>

      <ListEmpty
        v-else-if="!entries.length"
        :searching="hasFilters"
        icon="i-lucide-history"
        title="Изменений не найдено"
        @reset="resetFilters"
      />

      <div v-else class="space-y-5">
        <section v-for="day in days" :key="day.key">
          <h2 class="mb-1! text-xs! font-medium! uppercase tracking-wide text-muted">{{ day.label }}</h2>
          <ul class="-mx-2 divide-y divide-default">
            <li v-for="entry in day.entries" :key="entry.id">
              <component
                :is="auditLogLink(entry) ? NuxtLink : 'div'"
                :to="auditLogLink(entry) ?? undefined"
                :class="[
                  'flex items-start gap-3 rounded-lg px-2 py-2.5',
                  auditLogLink(entry) ? 'hover:bg-elevated focus-visible:outline-2 focus-visible:outline-primary' : '',
                ]"
              >
                <UAvatar :alt="auditAuthor(entry)" size="sm" class="mt-0.5" />
                <div class="min-w-0 flex-1">
                  <p class="text-sm leading-snug text-default">
                    <span class="font-medium text-highlighted">{{ auditAuthor(entry) }}</span>
                    <UBadge
                      :label="AUDIT_ACTION_LABELS[entry.action]?.label ?? entry.action"
                      :color="AUDIT_ACTION_LABELS[entry.action]?.color ?? 'neutral'"
                      variant="subtle"
                      size="sm"
                      class="mx-1.5 align-middle"
                    />
                    <span class="text-muted">{{ auditEntityLabel(entry.entityType).toLowerCase() }}</span>
                    <span v-if="entry.entityTitle" class="font-medium text-highlighted"> «{{ entry.entityTitle }}»</span>
                    <span v-else class="text-dimmed"> (запись удалена или без названия)</span>
                  </p>
                </div>
                <time
                  class="shrink-0 text-xs text-dimmed tabular-nums"
                  :datetime="entry.createdAt"
                  :title="formatDateTime(entry.createdAt)"
                >
                  {{ dayjs(entry.createdAt).format('HH:mm') }}
                </time>
              </component>
            </li>
          </ul>
        </section>
      </div>
    </div>
  </NuxtLayout>
</template>
