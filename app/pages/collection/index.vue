<script setup lang="ts">
import type { BookCollection } from '~~/services/types/book.type';
import { useBookApi } from '~~/services/api/book.api';
import type { Meta } from '~~/services/api';

const PAGE_SIZE = 24;

const toast = useToast();
const bookApi = useBookApi();

// Старые ссылки ?editId=<id> ведут на страницу редактора
await redirectEditIdToPage('/collection');

const page = ref(1);
const collections = ref<BookCollection[]>([]);
const meta = ref<Meta>();
const loading = ref(false);

const fetchData = async () => {
  loading.value = true;
  try {
    const res = await bookApi.getAllCollections({
      isDeleted: true,
      limit: PAGE_SIZE,
      page: page.value,
    });
    collections.value = res.data ?? [];
    meta.value = res.meta;
  } catch {
    toast.add({ title: 'Не удалось загрузить подборки', color: 'error' });
  } finally {
    loading.value = false;
  }
};

await fetchData();
watch(page, fetchData);

const setVisibility = async (collection: BookCollection, isDeleted: boolean) => {
  const previous = collection.isDeleted;
  collection.isDeleted = isDeleted;
  try {
    await bookApi.updateCollection(collection.id, { isDeleted });
    toast.add({ title: isDeleted ? 'Подборка скрыта' : 'Подборка опубликована', color: 'success' });
  } catch {
    collection.isDeleted = previous;
    toast.add({ title: 'Не удалось изменить видимость', color: 'error' });
  }
};

useHead({ title: 'НОМБ | Подборки книг' });
</script>

<template>
  <NuxtLayout
    v-model="page"
    name="table"
    title="Подборки книг"
    :description="meta ? `${meta.total} ${plural(meta.total, ['подборка', 'подборки', 'подборок'])} в разделе «Книги» на сайте` : undefined"
    create-label="Новая подборка"
    :meta="meta"
    :loading="loading"
    :event-create="() => navigateTo('/collection/admin')"
  >
    <div class="p-6">
      <div
        v-if="collections.length"
        class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4"
      >
        <!-- Вся карточка — ссылка на редактор (растянутая ссылка у названия); бейдж поверх -->
        <article
          v-for="collection in collections"
          :key="collection.id"
          class="group relative flex flex-col rounded-xl border border-default bg-default p-4 shadow-xs transition-shadow hover:shadow-md"
        >
          <div class="rounded-lg bg-elevated px-4 pb-3 pt-5">
            <CollectionCoverFan :covers="collection.covers ?? []" :height="110" />
          </div>

          <NuxtLink
            :to="`/collection/admin/${collection.id}`"
            class="mt-3 line-clamp-2 font-semibold text-highlighted after:absolute after:inset-0 after:rounded-xl group-hover:underline focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:outline-primary"
          >
            {{ collection.label }}
          </NuxtLink>
          <p v-if="collection.description" class="mt-1 line-clamp-2 text-sm text-muted">
            {{ collection.description }}
          </p>

          <div class="mt-auto flex items-center justify-between gap-2 pt-3">
            <span class="text-sm text-muted">
              {{ collection.bookCount ?? 0 }}
              {{ plural(collection.bookCount ?? 0, ['книга', 'книги', 'книг']) }}
            </span>
            <div class="relative z-10">
              <ListVisibilityBadge
                :hidden="collection.isDeleted"
                :toggle="() => setVisibility(collection, !collection.isDeleted)"
              />
            </div>
          </div>
        </article>
      </div>

      <div v-else-if="!loading" class="py-16 text-center">
        <UIcon name="i-lucide-library" class="mx-auto mb-3 size-12 text-dimmed" />
        <p class="font-medium text-highlighted">
          Подборок пока нет
        </p>
        <p class="mt-1 text-sm text-muted">
          Соберите книги вокруг темы — так читателю проще выбрать, что взять.
        </p>
        <UButton
          class="mt-4"
          icon="i-lucide-plus"
          label="Создать подборку"
          to="/collection/admin"
        />
      </div>
    </div>
  </NuxtLayout>
</template>
