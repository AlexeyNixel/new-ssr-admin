<script setup lang="ts">
import type { Page } from '~~/services/types/page.type';
import { usePageApi } from '~~/services/api/page.api';

const props = defineProps<{
  page?: Page;
}>();

const pageApi = usePageApi();
const toast = useToast();

const emit = defineEmits(['close']);

const newPage = ref({
  title: props.page?.title || '',
  content: props.page?.content || '',
  isDeleted: false,
  slug: props.page?.slug || '',
});

const onSubmit = async () => {
  if (props.page) {
    await pageApi.update(props.page.id, newPage.value);
    toast.add({
      title: 'Страница обновлена',
    });
  } else {
    await pageApi.create(newPage.value);
    toast.add({
      title: 'Страница создана',
    });
  }
  emit('close', true);
};
</script>

<template>
  <UForm class="p-4 flex flex-col gap-5" :on-submit="onSubmit">
    <h1>
      {{ page ? 'Обновление страницы' : 'Создание страницы' }}
    </h1>
    <UFormField label="Назвиние">
      <UInput v-model="newPage.title" class="w-full" />
    </UFormField>

    <UFormField label="Основной контент">
      <rich-editor v-model="newPage.content" />
    </UFormField>

    <UButton type="submit">{{ page ? 'Обновить' : 'Создать' }}</UButton>
  </UForm>
</template>

<style scoped>
:deep(.ck.ck-editor) {
  max-width: 100%;
}

:deep(.ck.ck-editor__editable) {
  min-height: 200px;
  max-height: 350px;
  overflow-y: auto;
}
</style>
