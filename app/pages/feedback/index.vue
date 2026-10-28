<script setup lang="ts">
import { useFeedbackApi } from '~~/services/api/feedback.api';
import type { Meta } from '~~/services/api';
import type { Feedback, FeedbackType } from '~~/services/types/feedback.type';
import AdminFeedback from '~/components/Modals/AdminFeedback.vue';
import { FEEDBACK_TYPES } from '~/utils/feedbackTypes';

/*
 * Ошибки и пожелания — чеклист: галочка = выполнено (ставит разработчик).
 * Отмеченное остаётся в списке до перезагрузки, чтобы можно было снять
 * галочку, если промахнулись.
 */

const feedbackApi = useFeedbackApi();
const toast = useToast();
const overlay = useOverlay();
const modal = overlay.create(AdminFeedback);
const { canManage, openCount, currentUserId, loadSummary, openReport, openIntro, storage, userKey } = useFeedback();

const { page, search, filters } = useListQuery({ status: 'open', type: 'all', mine: 'all' });

const items = ref<Feedback[]>([]);
const meta = ref<Meta>();
const loading = ref(false);

// «Новое» — пришло после прошлого визита на эту страницу (и не моё)
const visitedKey = userKey('visited');
const lastVisit = storage.get(visitedKey);
storage.set(visitedKey, new Date().toISOString());
const isNew = (item: Feedback) =>
  !!lastVisit && !item.isDone && item.createdAt > lastVisit && item.authorId !== currentUserId.value;

const fetchData = async () => {
  loading.value = true;
  try {
    const res = await feedbackApi.getAllFeedback({
      page: page.value,
      limit: 20,
      status: filters.status as 'open' | 'done' | 'all',
      type: filters.type === 'all' ? undefined : (filters.type as FeedbackType),
      mine: filters.mine === 'mine' ? '1' : undefined,
      search: search.value || undefined,
    });
    items.value = res.data ?? [];
    meta.value = res.meta;
  } catch {
    items.value = [];
    meta.value = undefined;
    toast.add({ title: 'Не удалось загрузить обращения', color: 'error' });
  } finally {
    loading.value = false;
  }
};

watch([page, search, () => ({ ...filters })], fetchData);
await fetchData();
loadSummary();

const handleOpen = async (feedback?: Feedback) => {
  const saved = await modal.open({ feedback, canManage: canManage.value }).result;
  if (saved) await Promise.all([fetchData(), loadSummary()]);
};

const handleCreate = async () => {
  if (await openReport()) await fetchData();
};

useModalRouteOpener({ modal, param: 'feedbackId', onClosed: () => fetchData() });

const toggleDone = async (item: Feedback, value: boolean | 'indeterminate') => {
  const isDone = value === true;
  const previous = { isDone: item.isDone, doneAt: item.doneAt };
  item.isDone = isDone;
  item.doneAt = isDone ? new Date().toISOString() : null;
  try {
    await feedbackApi.update(item.id, { isDone });
    loadSummary();
  } catch {
    Object.assign(item, previous);
    toast.add({ title: 'Не удалось отметить, попробуйте ещё раз', color: 'error' });
  }
};

const resetFilters = () => {
  search.value = '';
  filters.status = 'open';
  filters.type = 'all';
  filters.mine = 'all';
};

const statusTabs = [
  { label: 'Не выполнено', value: 'open', icon: 'i-lucide-circle-dashed' },
  { label: 'Выполнено', value: 'done', icon: 'i-lucide-circle-check' },
  { label: 'Все', value: 'all' },
];

const typeOptions = [
  { label: 'Все типы', value: 'all' },
  ...(Object.keys(FEEDBACK_TYPES) as FeedbackType[]).map((value) => ({
    label: FEEDBACK_TYPES[value].label,
    value,
    icon: FEEDBACK_TYPES[value].icon,
  })),
];

const mineOptions = [
  { label: 'От всех', value: 'all' },
  { label: 'Мои', value: 'mine' },
];

const authorName = (item: Feedback) => item.author?.name || item.author?.username || 'Без автора';
const searching = computed(
  () => !!search.value || filters.type !== 'all' || filters.mine !== 'all' || filters.status !== 'open'
);

useHead({ title: 'НОМБ | Ошибки и пожелания' });
</script>

<template>
  <NuxtLayout
    v-model="page"
    v-model:search="search"
    name="table"
    title="Ошибки и пожелания"
    :description="`Не выполнено: ${openCount}. Обращения из этого списка исправляются в первую очередь`"
    :meta="meta"
    :loading="loading"
    create-label="Сообщить"
    search-placeholder="Поиск по обращениям…"
    :event-create="handleCreate"
  >
    <template #actions>
      <UButton
        icon="i-lucide-circle-help"
        color="neutral"
        variant="ghost"
        aria-label="Как это работает"
        @click="openIntro()"
      >
        <span class="hidden md:inline">Как это работает</span>
      </UButton>
    </template>

    <template #filters>
      <UTabs v-model="filters.status" :items="statusTabs" :content="false" size="sm" />
      <USelect v-model="filters.type" :items="typeOptions" size="sm" class="w-36" />
      <USelect v-model="filters.mine" :items="mineOptions" size="sm" class="w-28" />
    </template>

    <ListEmpty
      v-if="!items.length && !loading"
      :searching="searching"
      icon="i-lucide-list-checks"
      title="Обращений нет — всё сделано"
      @reset="resetFilters"
    />

    <ul v-else class="divide-y divide-default">
      <li
        v-for="item in items"
        :key="item.id"
        class="group flex cursor-pointer gap-3 px-4 py-3 transition-colors hover:bg-elevated/50 sm:px-5"
        :class="item.isDone ? 'bg-success/[0.03]' : ''"
        @click="handleOpen(item)"
      >
        <div class="pt-0.5" @click.stop>
          <UCheckbox
            :model-value="item.isDone"
            :disabled="!canManage"
            color="success"
            size="lg"
            :aria-label="item.isDone ? 'Снять отметку о выполнении' : 'Отметить выполненным'"
            :title="canManage ? '' : 'Отмечает разработчик'"
            @update:model-value="toggleDone(item, $event)"
          />
        </div>

        <div class="min-w-0 flex-1 space-y-1">
          <div class="flex flex-wrap items-center gap-2">
            <UBadge
              :color="FEEDBACK_TYPES[item.type].color"
              :icon="FEEDBACK_TYPES[item.type].icon"
              :label="FEEDBACK_TYPES[item.type].label"
              variant="subtle"
              size="sm"
            />
            <UBadge v-if="isNew(item)" label="Новое" color="primary" variant="solid" size="sm" />
            <p
              class="min-w-0 font-medium"
              :class="item.isDone ? 'text-muted line-through decoration-muted' : 'text-highlighted'"
            >
              {{ item.title }}
            </p>
          </div>

          <p v-if="item.description" class="line-clamp-2 whitespace-pre-line text-sm text-muted">
            {{ item.description }}
          </p>

          <div class="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-dimmed">
            <span class="flex items-center gap-1">
              <UIcon name="i-lucide-user" class="size-3.5" />
              {{ authorName(item) }}
            </span>
            <span :title="formatDateTime(item.createdAt)">{{ formatRelative(item.createdAt) }}</span>
            <NuxtLink
              v-if="item.pageUrl"
              :to="item.pageUrl"
              class="flex max-w-60 items-center gap-1 truncate hover:text-primary"
              @click.stop
            >
              <UIcon name="i-lucide-link" class="size-3.5 shrink-0" />
              <span class="truncate">{{ item.pageUrl }}</span>
            </NuxtLink>
            <a
              v-if="item.screenshot"
              :href="staticUrl(item.screenshot.path)"
              target="_blank"
              rel="noopener"
              class="flex items-center gap-1 hover:text-primary"
              @click.stop
            >
              <UIcon name="i-lucide-image" class="size-3.5" />
              Скриншот
            </a>
            <span v-if="item.isDone && item.doneAt" class="flex items-center gap-1 text-success">
              <UIcon name="i-lucide-circle-check" class="size-3.5" />
              выполнено {{ formatRelative(item.doneAt) }}
            </span>
          </div>

          <p
            v-if="item.response"
            class="mt-1 rounded-lg border-l-2 border-success bg-success/5 px-3 py-1.5 text-sm text-default"
          >
            <span class="font-medium text-success">Ответ:</span> {{ item.response }}
          </p>
        </div>

        <UIcon
          name="i-lucide-chevron-right"
          class="mt-1 size-4 shrink-0 text-dimmed opacity-0 transition-opacity group-hover:opacity-100"
        />
      </li>
    </ul>
  </NuxtLayout>
</template>
