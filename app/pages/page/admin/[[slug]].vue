<script setup lang="ts">
import type { Page } from '~~/services/types/page.type';
import { usePageApi } from '~~/services/api/page.api';

const route = useRoute();

const slug = route.params.slug;

const pageApi = usePageApi();
const toast = useToast();
const page = ref();

if (slug) {
  const { data } = await pageApi.getOnePage(slug as string);
  page.value = data;
}

const newPage = ref({
  title: page?.value?.title || '',
  content: page?.value?.content || '',
  isDeleted: false,
  slug: page?.value?.slug || '',
});

const onSubmit = async () => {
  if (page.value) {
    await pageApi.update(page.value.id, newPage.value);
    console.log(newPage.value);
    toast.add({
      title: 'Страница обновлена',
    });
  } else {
    await pageApi.create(newPage.value);
    toast.add({
      title: 'Страница создана',
    });
  }
};
</script>

<template>
  <div class="min-h-screen bg-white">
    <div class="max-w-7xl mx-auto">
      <h1 class="text-gray-900">
        {{ page ? 'Обновление страницы' : 'Создание страницы' }}
      </h1>
      <UForm
        class="bg-white p-4 dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden"
        :on-submit="onSubmit"
      >
        <UFormField label="Назвиние">
          <UInput v-model="newPage.title" class="w-full" />
        </UFormField>

        <UFormField label="Основной контент">
          <rich-editor v-model="newPage.content" />
        </UFormField>

        <UButton type="submit">{{ page ? 'Обновить' : 'Создать' }}</UButton>
      </UForm>
    </div>
  </div>
</template>

<style scoped>
:deep(.ck.ck-editor) {
  max-width: 100%;
}
</style>
