<script setup lang="ts">
import { ModalsAdminExhibition, ModalsAdminExhibitionUpload } from '#components';
import { useExhibitionApi } from '~~/services/api/exhibition.api';
import type { Exhibition } from '~~/services/types/exhibition.type';
import type { Meta } from '~~/services/api';

const PAGE_SIZE = 24;

const overlay = useOverlay();
const uploadModal = overlay.create(ModalsAdminExhibitionUpload);
const editModal = overlay.create(ModalsAdminExhibition);
const toast = useToast();
const exhibitionApi = useExhibitionApi();

const { page, search, filters } = useListQuery({ status: 'all' });

const exhibitions = ref<Exhibition[]>([]);
const meta = ref<Meta>();
const loading = ref(false);
const counts = reactive({ all: 0, hidden: 0 });
/** Метка для сброса кеша обложек после замены */
const coverVersion = ref<number>();

const fetchData = async () => {
  loading.value = true;
  try {
    const res = await exhibitionApi.getAll({
      page: page.value,
      limit: PAGE_SIZE,
      search: search.value || undefined,
      ...(filters.status !== 'all' && { status: filters.status as 'visible' | 'hidden' }),
    });
    exhibitions.value = res.data ?? [];
    meta.value = res.meta;
  } catch {
    toast.add({ title: 'Не удалось загрузить выставки', color: 'error' });
  } finally {
    loading.value = false;
  }
};

const fetchCounts = async () => {
  const [all, hidden] = await Promise.allSettled([
    exhibitionApi.getAll({ limit: 1 }),
    exhibitionApi.getAll({ limit: 1, status: 'hidden' }),
  ]);
  if (all.status === 'fulfilled') counts.all = all.value.meta?.total ?? 0;
  if (hidden.status === 'fulfilled') counts.hidden = hidden.value.meta?.total ?? 0;
};

const reload = () => Promise.all([fetchData(), fetchCounts()]);

await reload();
watch([page, search, () => ({ ...filters })], fetchData);

const openUpload = async () => {
  if (await uploadModal.open().result) await reload();
};

const openEdit = async (exhibition: Exhibition) => {
  if (await editModal.open({ exhibition }).result) {
    coverVersion.value = Date.now();
    await fetchData();
  }
};

const setHidden = async (exhibition: Exhibition, isHidden: boolean) => {
  const previous = exhibition.isHidden;
  exhibition.isHidden = isHidden;
  try {
    await exhibitionApi.update(exhibition.id, { isHidden });
    counts.hidden += isHidden ? 1 : -1;
    toast.add({ title: isHidden ? 'Выставка скрыта с сайта' : 'Выставка снова на сайте', color: 'success' });
  } catch {
    exhibition.isHidden = previous;
    toast.add({ title: 'Не удалось изменить статус', color: 'error' });
  }
};

const rowActions = (exhibition: Exhibition) => [
  [
    { label: 'Редактировать', icon: 'i-lucide-pencil', onSelect: () => openEdit(exhibition) },
    { label: 'Открыть на сайте', icon: 'i-lucide-external-link', to: exhibitionSiteUrl(exhibition), target: '_blank' },
    { label: 'Открыть пакет', icon: 'i-lucide-file-code', to: staticUrl(exhibition.path), target: '_blank' },
  ],
  [
    {
      label: exhibition.isHidden ? 'Показать на сайте' : 'Скрыть с сайта',
      icon: exhibition.isHidden ? 'i-lucide-eye' : 'i-lucide-eye-off',
      onSelect: () => setHidden(exhibition, !exhibition.isHidden),
    },
  ],
];

const onCoverError = (event: Event) => {
  (event.target as HTMLImageElement).style.visibility = 'hidden';
};

const statusItems = computed(() => [
  { label: `Все · ${counts.all}`, value: 'all' },
  { label: `На сайте · ${counts.all - counts.hidden}`, value: 'visible' },
  { label: `Скрытые · ${counts.hidden}`, value: 'hidden' },
]);

const resetFilters = () => {
  search.value = '';
  filters.status = 'all';
};

useHead({ title: 'НОМБ | Виртуальные выставки' });
</script>

<template>
  <NuxtLayout
    v-model="page"
    v-model:search="search"
    name="table"
    title="Виртуальные выставки"
    :description="`${counts.all} ${plural(counts.all, ['выставка', 'выставки', 'выставок'])}, скрыто ${counts.hidden}`"
    create-label="Загрузить выставку"
    search-placeholder="Поиск по названию или адресу…"
    :meta="meta"
    :loading="loading"
    :event-create="openUpload"
  >
    <template #filters>
      <UTabs v-model="filters.status" :items="statusItems" :content="false" size="sm" />
    </template>

    <div class="p-4 sm:p-5">
      <div v-if="loading && !exhibitions.length" class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <USkeleton v-for="i in 8" :key="i" class="aspect-[4/3] w-full rounded-xl" />
      </div>

      <ListEmpty
        v-else-if="!exhibitions.length"
        :searching="!!search || filters.status !== 'all'"
        icon="i-lucide-gallery-horizontal"
        title="Выставок пока нет"
        @reset="resetFilters"
      />

      <ul v-else class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <li
          v-for="exhibition in exhibitions"
          :key="exhibition.id"
          class="group flex flex-col overflow-hidden rounded-xl bg-default ring-1 ring-default transition hover:ring-primary/50"
          :class="exhibition.isHidden ? 'opacity-70' : ''"
        >
          <button
            type="button"
            class="relative aspect-video cursor-pointer overflow-hidden bg-elevated text-left"
            :aria-label="`Редактировать «${exhibition.title || exhibitionSlug(exhibition)}»`"
            @click="openEdit(exhibition)"
          >
            <UIcon name="i-lucide-image-off" class="absolute inset-0 m-auto size-8 text-dimmed" />
            <img
              :src="exhibitionCover(exhibition, coverVersion)"
              alt=""
              loading="lazy"
              class="relative size-full object-cover"
              @error="onCoverError"
            >
          </button>

          <div class="flex flex-1 flex-col gap-2 p-3">
            <div class="flex items-start gap-2">
              <div class="min-w-0 flex-1">
                <p
                  class="line-clamp-2 font-medium leading-snug"
                  :class="exhibition.title ? 'text-highlighted' : 'italic text-muted'"
                >
                  {{ exhibition.title || 'Без названия' }}
                </p>
                <p class="truncate font-mono text-xs text-muted">{{ exhibitionSlug(exhibition) }}</p>
              </div>
              <ListRowActions :items="rowActions(exhibition)" />
            </div>

            <div class="mt-auto flex items-center justify-between gap-2">
              <ListVisibilityBadge
                :hidden="exhibition.isHidden"
                shown-label="На сайте"
                hidden-label="Скрыта"
                :toggle="() => setHidden(exhibition, !exhibition.isHidden)"
              />
              <span class="text-xs text-dimmed">{{ formatDate(exhibition.createdAt) }}</span>
            </div>
          </div>
        </li>
      </ul>
    </div>
  </NuxtLayout>
</template>
