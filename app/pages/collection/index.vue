<script setup lang="ts">
import type { BookCollection } from '~~/services/types/book-collection.type';
import { useBookApi } from '~~/services/api/book.api';
import AdminCollection from '~/components/Modals/AdminCollection.vue';
import dayjs from 'dayjs';

const overlay = useOverlay();
const modal = overlay.create(AdminCollection);
const bookApi = useBookApi();
const collectionsRes = ref();
const page = ref(1);

const fetchData = async () => {
  collectionsRes.value = await bookApi.getAllCollections({
    include: 'preview',
    limit: 8,
    page: page.value,
  });
};

const handleOpenModal = async (collection?: BookCollection) => {
  const instance = modal.open({ collection });
  const result = await instance.result;
  if (result) await fetchData();
};

await fetchData();

watch(page, () => fetchData());

useHead({ title: 'НОМБ | Сборники книг' });
</script>

<template>
  <NuxtLayout
    v-model="page"
    name="table"
    title="Управление подборками книг"
    :meta="collectionsRes.meta"
    :event-create="() => handleOpenModal()"
  >
    <div class="p-6">
      <div
        v-if="collectionsRes.data.length > 0"
        class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
      >
        <UCard
          v-for="collection in collectionsRes.data"
          :key="collection.id"
          class="overflow-hidden hover:shadow-lg transition-shadow duration-200 group"
        >
          <div class="relative h-44 -mx-4 -mt-4 mb-4 overflow-hidden bg-neutral-100 dark:bg-neutral-800">
            <img
              v-if="collection.preview"
              :src="'http://static.infomania.ru' + collection.preview.path"
              :alt="collection.label"
              class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            <div v-else class="w-full h-full flex items-center justify-center">
              <UIcon name="i-heroicons-book-open" class="w-10 h-10 text-neutral-300" />
            </div>
            <UBadge
              :label="collection.isDeleted ? 'Скрыто' : 'Опубликовано'"
              :color="collection.isDeleted ? 'warning' : 'success'"
              variant="subtle"
              size="sm"
              class="absolute top-2 right-2"
            />
          </div>

          <p class="font-semibold line-clamp-2 min-h-[2.5rem]">
            {{ collection.label }}
          </p>

          <p class="text-xs text-neutral-400 mt-1">
            {{ dayjs(collection.createdAt).format('DD.MM.YYYY') }}
          </p>

          <template #footer>
            <div class="flex gap-2 justify-end">
              <UButton
                icon="i-heroicons-pencil-square"
                color="secondary"
                variant="outline"
                size="sm"
                label="Редактировать"
                @click="handleOpenModal(collection)"
              />
            </div>
          </template>
        </UCard>
      </div>

      <div v-else class="py-16 text-center text-neutral-400">
        <UIcon name="i-heroicons-book-open" class="w-12 h-12 mx-auto mb-3 opacity-40" />
        <p>Подборок пока нет</p>
      </div>
    </div>
  </NuxtLayout>
</template>
