<script setup lang="ts">
import type { Page, PageBlock } from '~~/services/types/page.type';
import { usePageApi } from '~~/services/api/page.api';
import { pageSchema } from '~/schemas/page.schema';

const route = useRoute();
const slug = route.params.slug as string | undefined;

const pageApi = usePageApi();
const toast = useToast();
const page = ref<Page>();

if (slug) {
  const { data } = await pageApi.getOnePage(slug);
  page.value = data;
}

const newPage = reactive({
  title: page.value?.title || '',
  slug: page.value?.slug || '',
  content: page.value?.content || '',
  isDeleted: page.value?.isDeleted || false,
  blocks: (page.value?.blocks || []) as PageBlock[],
});

const tabItems = [
  { label: 'Текстовый контент', icon: 'i-heroicons-document-text', slot: 'text' as const },
  { label: 'Конструктор блоков', icon: 'i-heroicons-squares-2x2', slot: 'blocks' as const },
];

const onSubmit = async () => {
  try {
    if (page.value) {
      await pageApi.update(page.value.id, newPage);
      toast.add({ title: 'Страница обновлена', color: 'success' });
    } else {
      await pageApi.create(newPage);
      toast.add({ title: 'Страница создана', color: 'success' });
    }

    navigateTo('/page');
  } catch {
    toast.add({ title: 'Произошла ошибка', color: 'error' });
  }
};

useHead({
  title: 'НОМБ | Страница',
});
</script>

<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
    <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-gray-900 dark:text-white">
          {{ page ? 'Редактирование страницы' : 'Создание страницы' }}
        </h1>
        <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Заполните основные поля и при необходимости настройте конструктор блоков
        </p>
      </div>

      <UForm :schema="pageSchema" :state="newPage" class="space-y-6" @submit="onSubmit">
        <div
          class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 space-y-4"
        >
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <UFormField label="Название" name="title" required>
              <UInput v-model="newPage.title" placeholder="Название страницы" class="w-full" />
            </UFormField>

            <UFormField
              label="URL-адрес (slug)"
              name="slug"
              description="Используется в адресе страницы на сайте"
            >
              <UInput v-model="newPage.slug" placeholder="example-slug" class="w-full" />
            </UFormField>
          </div>

          <UCheckbox v-model="newPage.isDeleted" label="Скрыта" color="primary" />
        </div>

        <div
          class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6"
        >
          <UTabs :items="tabItems" class="w-full">
            <template #text>
              <UFormField
                label="Основной контент"
                description="Используется, если конструктор блоков пуст"
                name="content"
                class="mt-4"
              >
                <EditorCustom v-model="newPage.content" />
              </UFormField>
            </template>

            <template #blocks>
              <div class="mt-4">
                <PageBuilder v-model="newPage.blocks" />
              </div>
            </template>
          </UTabs>
        </div>

        <div class="flex justify-end">
          <UButton type="submit" size="lg" color="primary">
            {{ page ? 'Обновить' : 'Создать' }}
          </UButton>
        </div>
      </UForm>
    </div>
  </div>
</template>
