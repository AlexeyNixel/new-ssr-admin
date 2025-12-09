<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <!-- Заголовок страницы -->
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-gray-900 dark:text-white">
          {{ slug ? 'Редактирование новости' : 'Создание новости' }}
        </h1>
        <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Заполните все необходимые поля для публикации новости
        </p>
      </div>

      <UForm
        class="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden"
        :schema="schema"
        :state="newPost"
        @submit="createPost"
      >
        <div class="flex flex-col lg:flex-row gap-8 p-8">
          <!-- Правая боковая панель -->
          <div class="lg:w-80 flex-shrink-0 space-y-6">
            <!-- Загрузка изображения -->
            <UFormField
              name="previewFileId"
              label="Изображение новости"
              class="space-y-3"
            >
              <UiUploadImage
                v-model="newPreview.id"
                :preview="newPreview?.path"
              />
            </UFormField>

            <!-- Дата публикации -->
            <UFormField label="Дата публикации" class="space-y-3">
              <UPopover class="w-full">
                <UButton
                  color="neutral"
                  variant="subtle"
                  icon="i-lucide-calendar"
                >
                  {{
                    publishedAt
                      ? dayjs(publishedAt).format('DD.MM.YYYY')
                      : 'Выберите дату'
                  }}
                </UButton>

                <template #content>
                  <UCalendar v-model="publishedAt" class="p-2" />
                </template>
              </UPopover>
            </UFormField>

            <!-- Отдел -->
            <UFormField
              name="departmentId"
              required
              label="Отдел"
              class="space-y-3"
            >
              <USelect
                v-model="newPost.departmentId"
                :items="departments"
                label-key="title"
                value-key="id"
                placeholder="Выбрать отдел"
                variant="outline"
                color="neutral"
                class="w-full"
              />
            </UFormField>

            <!-- Тэги -->
            <UFormField label="Тэги" class="space-y-3">
              <UiSelectTag v-model="newPost.tags" />
            </UFormField>

            <UFormField label="Загрузить документ">
              <UploadDocument />
            </UFormField>

            <!-- Настройки -->
            <div class="space-y-3">
              <label
                class="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Настройки
              </label>
              <div
                class="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 space-y-3"
              >
                <UCheckbox
                  v-model="newPost.isDeleted"
                  color="primary"
                  label="Скрыта"
                  class="w-full"
                />
                <UCheckbox
                  v-model="newPost.isPinned"
                  color="primary"
                  label="Закреплена"
                  class="w-full"
                />
              </div>
            </div>

            <!--             Документы -->
            <UFormField class="space-y-3" label="Документы">
              <UFileUpload variant="button" />
            </UFormField>

            <!-- Кнопка действия -->
            <div class="pt-4">
              <UButton color="primary" class="w-full" size="lg" type="submit">
                {{ slug ? 'Обновить новость' : 'Создать новость' }}
              </UButton>
            </div>
          </div>

          <!-- Основной контент -->
          <div class="flex-1 space-y-8">
            <UFormField
              name="title"
              required
              label="Заголовок новости"
              class="space-y-3"
            >
              <UInput
                v-model="newPost.title"
                placeholder="Введите заголовок новости"
                size="xl"
                class="w-full"
              />
            </UFormField>
            <UFormField
              aria-valuemax="512"
              required
              label="Краткое описание"
              class="space-y-3"
              name="description"
            >
              <UTextarea
                v-model="newPost.description"
                placeholder="Введите краткое описание"
                :rows="4"
                class="w-full"
              />
            </UFormField>

            <UFormField label="URL-адрес" class="space-y-3" name="slug">
              <UInput
                v-model="newPost.slug"
                placeholder="example-slug"
                class="w-full"
              />
            </UFormField>

            <UFormField
              required
              label="Содержание новости"
              class="space-y-3"
              name="content"
            >
              <rich-editor v-model="newPost.content" />
            </UFormField>
          </div>
        </div>
      </UForm>
    </div>
  </div>
</template>

<script setup lang="ts">
import { z } from 'zod';
import dayjs from 'dayjs';
import { usePostApi } from '~~/services/api/post.api';
import { useDepartmentApi } from '~~/services/api/department.api';
import { CalendarDate } from '@internationalized/date';
import type { Tag } from '~~/services/types/tag.type';
import UploadDocument from '~/components/Ui/UploadDocument.vue';

const route = useRoute();
const toast = useToast();
const postApi = usePostApi();
const departmentApi = useDepartmentApi();

const { slug } = route.params;

const publishedAt = shallowRef();
const newPreview = reactive({
  path: '',
  id: '',
});

const schema = z.object({
  title: z
    .string('Обязательное поле')
    .min(1, 'Обязательное поле')
    .transform((val) => val.trim())
    .pipe(
      z
        .string()
        .min(8, 'Должно быть минимум 8 символов')
        .refine((val) => val.length > 0)
    ),
  description: z
    .string('Обязательное поле')
    .min(1, 'Обязательное поле')

    .transform((val) => val.trim())
    .pipe(
      z
        .string()
        .min(16, 'Должно быть минимум 16 символов')
        .max(512, 'Не должно превышать 512 символов')
        .refine((val) => val.length > 0)
    ),
  content: z.string('Обязательное поле'),
  departmentId: z.string('Обязательное поле'),
  previewFileId: z.string('Обязательное поле').min(1, 'Обязательное поле'),
});

const newPost = reactive({
  title: undefined,
  description: undefined,
  content: undefined,
  publishedAt: new Date(),
  slug: undefined,
  tags: [] as Array<string>,
  departmentId: undefined,
  isDeleted: false,
  isPinned: false,
  previewFileId: undefined,
});

const { data: departments } = await departmentApi.getAllDepartments({
  limit: 50,
});

if (slug) {
  const { data } = await postApi.getOnePost(slug as string);
  if (data.preview) {
    newPreview.path = data.preview.path;
  }

  const now = new Date(data.publishedAt);

  publishedAt.value = new CalendarDate(
    now.getFullYear(),
    now.getMonth() + 1,
    now.getDate()
  );

  Object.keys(newPost).forEach((key) => {
    if (key === 'tags') {
      data.tags.forEach((tag: Tag) => {
        newPost.tags.push(tag.id);
      });
    } else {
      //@ts-expect-error
      newPost[key] = data[key];
    }
  });
}

const createPost = async () => {
  const newData = {
    ...newPost,
    previewFileId: newPreview.id || newPost.previewFileId,
    publishedAt: dayjs(publishedAt.value),
  };

  console.log(newData);

  try {
    if (slug) {
      await postApi.updatePost(slug as string, { ...newData });
      toast.add({ title: 'Пост успешно обновлен', color: 'success' });
    } else {
      await postApi.createPost({ ...newData });
      toast.add({ title: 'Пост успешно создан', color: 'success' });
    }

    navigateTo('/post');
  } catch {
    toast.add({ title: 'Произошла ошибка', color: 'error' });
  }
};

watch(newPreview, () => {
  if (newPreview.id) {
    newPost.previewFileId = newPreview.id;
  }
});
</script>
