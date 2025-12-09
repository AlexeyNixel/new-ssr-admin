<script setup lang="ts">
import type { BookCollection } from '~~/services/types/book-collection.type';
import { useBookApi } from '~~/services/api/book.api';
import AdminCollection from '~/components/Modals/AdminCollection.vue';

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
  const instance = modal.open({ collection: collection });
  const result = await instance.result;

  if (result) {
    await fetchData();
  }
};

await fetchData();

// Форматирование даты
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

watch(page, async () => {
  await fetchData();
});
</script>

<template>
  <NuxtLayout
    v-model="page"
    name="table"
    title="Управление подборками книг"
    :meta="collectionsRes.meta"
    :event-create="() => handleOpenModal()"
  >
    <div class="min-h-full bg-gray-50 p-6">
      <div
        v-if="collectionsRes.data.length > 0"
        class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
      >
        <UCard
          v-for="collection in collectionsRes.data"
          :key="collection.id"
          class="overflow-hidden hover:shadow-lg transition-shadow duration-300 group h-full flex flex-col"
        >
          <div class="relative h-48 overflow-hidden bg-gray-100">
            <img
              v-if="collection.preview"
              :src="'http://static.infomania.ru' + collection.preview.path"
              :alt="collection.label"
              class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            <div v-else class="w-full h-full flex items-center justify-center">
              <Icon
                name="i-heroicons-book-open"
                class="text-4xl text-gray-400"
              />
            </div>

            <UBadge
              :label="collection.isDeleted ? 'Черновик' : 'Опубликовано'"
              :color="collection.isDeleted ? 'neutral' : 'success'"
              variant="subtle"
              size="sm"
              class="absolute top-3 right-3"
            />
          </div>

          <div class="space-y-3">
            <h3
              class="font-bold text-gray-900 text-lg line-clamp-2 min-h-[3.5rem]"
            >
              {{ collection.label }}
            </h3>

            <div
              class="flex items-center justify-between text-sm text-gray-600"
            >
              <div class="flex items-center gap-2">
                <Icon
                  name="i-heroicons-calendar"
                  class="w-4 h-4 flex-shrink-0"
                />
                <span>{{ formatDate(collection.createdAt) }}</span>
              </div>
            </div>
          </div>

          <template #footer>
            <div class="flex gap-2 justify-end">
              <UButton
                icon="i-heroicons-eye"
                color="success"
                variant="outline"
                size="sm"
                class=""
                :to="`/collection/${collection.id}`"
              />
              <UButton
                icon="i-heroicons-pencil"
                color="secondary"
                variant="outline"
                size="sm"
                class=""
                @click="handleOpenModal(collection)"
              />
            </div>
          </template>
        </UCard>
      </div>
    </div>
  </NuxtLayout>
</template>

<style scoped></style>
