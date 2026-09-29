<script setup lang="ts">
import { useSlideApi } from '~~/services/api/slide.api';
import type { Slide } from '~~/services/types/slide.type';

const PAGE_SIZE = 24;

const slideApi = useSlideApi();
const toast = useToast();

await redirectEditIdToPage('/slide');

const { page, search, filters } = useListQuery({ status: 'published' });

/*
 * Слайдов ~100, а на сайте из них обычно около десятка — грузим все и
 * фильтруем на клиенте, чтобы по умолчанию показывать то, что сейчас на главной.
 */
const slides = ref<Slide[]>([]);
const loading = ref(false);

const fetchAll = async () => {
  loading.value = true;
  try {
    const result: Slide[] = [];
    for (let p = 1; ; p++) {
      const res = await slideApi.getAllSlides({ isDeleted: true, limit: 100, page: p });
      result.push(...(res.data ?? []));
      if (!res.meta?.hasNext || !res.data?.length) break;
    }
    slides.value = result;
  } catch {
    toast.add({ title: 'Не удалось загрузить слайды', color: 'error' });
  } finally {
    loading.value = false;
  }
};

await fetchAll();

const counts = computed(() => ({
  all: slides.value.length,
  published: slides.value.filter((s) => !s.isDeleted).length,
  hidden: slides.value.filter((s) => s.isDeleted).length,
}));

const linkHost = (url: string) => {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
};

const target = (slide: Slide) => {
  if (slide.url?.trim()) return { icon: 'i-lucide-external-link', text: linkHost(slide.url) };
  if (slide.post?.title) return { icon: 'i-lucide-newspaper', text: slide.post.title };
  if (slide.postId) return { icon: 'i-lucide-newspaper', text: 'Новость' };
  return { icon: 'i-lucide-link-2-off', text: 'Никуда не ведёт', warning: true };
};

const filtered = computed(() => {
  const query = search.value.trim().toLowerCase();
  return slides.value
    .filter((s) => {
      if (filters.status === 'published' && s.isDeleted) return false;
      if (filters.status === 'hidden' && !s.isDeleted) return false;
      if (!query) return true;
      return [s.image?.originalName, s.post?.title, s.url]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(query));
    })
    .sort((a, b) => (a.slideOrder ?? 0) - (b.slideOrder ?? 0) || b.createdAt.localeCompare(a.createdAt));
});

const visible = computed(() => filtered.value.slice((page.value - 1) * PAGE_SIZE, page.value * PAGE_SIZE));
const meta = computed(() => ({
  page: page.value,
  limit: PAGE_SIZE,
  total: filtered.value.length,
  hasPrev: page.value > 1,
  hasNext: page.value * PAGE_SIZE < filtered.value.length,
}));

// ---------- Действия ----------

const setVisibility = async (slide: Slide, isDeleted: boolean) => {
  const previous = slide.isDeleted;
  slide.isDeleted = isDeleted;
  try {
    await slideApi.updateSlide(slide.id, { isDeleted });
    toast.add({ title: isDeleted ? 'Слайд скрыт' : 'Слайд показан на главной', color: 'success' });
  } catch {
    slide.isDeleted = previous;
    toast.add({ title: 'Не удалось изменить видимость', color: 'error' });
  }
};

const rowActions = (slide: Slide) => [
  [
    { label: 'Редактировать', icon: 'i-lucide-pencil', to: `/slide/admin/${slide.id}` },
    ...(slide.url?.trim()
      ? [{ label: 'Открыть ссылку', icon: 'i-lucide-external-link', to: slide.url, target: '_blank' }]
      : []),
    ...(slide.postId
      ? [{ label: 'Открыть новость', icon: 'i-lucide-newspaper', to: `/post/admin/${slide.postId}` }]
      : []),
  ],
  [
    {
      label: slide.isDeleted ? 'Показать на главной' : 'Скрыть',
      icon: slide.isDeleted ? 'i-lucide-eye' : 'i-lucide-eye-off',
      onSelect: () => setVisibility(slide, !slide.isDeleted),
    },
  ],
];

const statusItems = computed(() => [
  { label: `На главной · ${counts.value.published}`, value: 'published' },
  { label: `Скрытые · ${counts.value.hidden}`, value: 'hidden' },
  { label: `Все · ${counts.value.all}`, value: 'all' },
]);

const resetFilters = () => {
  search.value = '';
  filters.status = 'all';
};

useHead({ title: 'НОМБ | Слайды' });
</script>

<template>
  <NuxtLayout
    v-model="page"
    v-model:search="search"
    name="table"
    title="Слайдер на главной"
    :description="`Сейчас на главной ${counts.published} ${plural(counts.published, ['слайд', 'слайда', 'слайдов'])}, всего ${counts.all}`"
    create-label="Новый слайд"
    search-placeholder="Поиск по файлу, новости или ссылке…"
    :meta="meta"
    :loading="loading"
    :event-create="() => navigateTo('/slide/admin')"
  >
    <template #filters>
      <UTabs v-model="filters.status" :items="statusItems" :content="false" size="sm" />
    </template>

    <ListEmpty
      v-if="!visible.length && !loading"
      :searching="!!search || filters.status !== 'all'"
      title="Слайдов пока нет"
      @reset="resetFilters"
    />

    <div v-else class="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2 xl:grid-cols-3">
      <!-- div, а не ссылка: внутри есть кнопки (статус, меню), им нельзя быть в <a> -->
      <div
        v-for="slide in visible"
        :key="slide.id"
        role="link"
        tabindex="0"
        class="group cursor-pointer overflow-hidden rounded-lg border border-default bg-default transition hover:border-accented hover:shadow-md focus-visible:outline-2 focus-visible:outline-primary"
        @click="navigateTo(`/slide/admin/${slide.id}`)"
        @keydown.enter.self="navigateTo(`/slide/admin/${slide.id}`)"
      >
        <div class="relative bg-elevated" style="aspect-ratio: 1270 / 500">
          <img
            v-if="slide.image?.path"
            :src="staticUrl(slide.image.path)"
            :alt="slide.image.originalName"
            loading="lazy"
            class="size-full object-cover transition group-hover:scale-[1.02]"
            :class="slide.isDeleted && 'grayscale opacity-60'"
          >
          <div v-else class="flex size-full items-center justify-center text-dimmed">
            <UIcon name="i-lucide-image-off" class="size-8" />
          </div>

          <!-- подложка: полупрозрачный бейдж иначе теряется на ярких баннерах -->
          <div class="absolute left-2 top-2 rounded-md bg-default shadow-sm">
            <ListVisibilityBadge
              :hidden="slide.isDeleted"
              shown-label="На главной"
              hidden-label="Скрыт"
              :toggle="() => setVisibility(slide, !slide.isDeleted)"
            />
          </div>
          <UBadge
            v-if="slide.slideOrder"
            :label="`№ ${slide.slideOrder}`"
            color="neutral"
            variant="solid"
            size="sm"
            class="absolute right-2 top-2"
          />
        </div>

        <div class="flex items-center gap-2 p-3">
          <div class="min-w-0 flex-1 space-y-0.5">
            <p
              class="flex items-center gap-1.5 truncate text-sm font-medium"
              :class="target(slide).warning ? 'text-warning' : 'text-highlighted'"
            >
              <UIcon :name="target(slide).icon" class="size-4 shrink-0 text-muted" />
              <span class="truncate">{{ target(slide).text }}</span>
            </p>
            <p class="truncate text-xs text-muted">
              {{ slide.image?.originalName || 'Без изображения' }} · {{ formatDate(slide.createdAt) }}
            </p>
          </div>
          <ListRowActions :items="rowActions(slide)" />
        </div>
      </div>
    </div>
  </NuxtLayout>
</template>
