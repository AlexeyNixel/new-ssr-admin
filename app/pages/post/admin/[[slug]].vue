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
      >
        <div class="flex flex-col lg:flex-row gap-8 p-8">
          <!-- Правая боковая панель -->
          <div class="lg:w-80 flex-shrink-0 space-y-6">
            <!-- Загрузка изображения -->
            <UFormField label="Изображение новости" class="space-y-3">
              <UFileUpload
                v-slot="{ open }"
                v-model="fileUpload"
                label="Загрузить изображение"
                description="Перетащите или выберите изображение"
                class="h-56 w-full"
                @update:model-value="uploadImage"
              >
                <img
                  v-if="newPreview.path"
                  class="h-56 w-full"
                  :src="`http://static.infomania.ru${newPreview.path}`"
                  alt=""
                  @click="open()"
                />
              </UFileUpload>
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
            <UFormField required label="Отдел" class="space-y-3">
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
              <USelectMenu
                v-model="newPost.tags"
                :items="tags"
                multiple
                label-key="title"
                value-key="id"
                placeholder="Выбрать рубрики"
                variant="outline"
                color="neutral"
                class="w-full"
              />
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
              <UButton
                v-if="slug"
                color="primary"
                class="w-full"
                size="lg"
                @click="updatePost"
              >
                Обновить новость
              </UButton>
              <UButton
                v-else
                color="primary"
                class="w-full"
                size="lg"
                @click="createPost"
              >
                Создать новость
              </UButton>
            </div>
          </div>

          <!-- Основной контент -->
          <div class="flex-1 space-y-8">
            <!-- Заголовок -->
            <UFormField required label="Заголовок новости" class="space-y-3">
              <UInput
                v-model="newPost.title"
                placeholder="Введите заголовок новости"
                size="xl"
                class="w-full"
              />
            </UFormField>

            <!-- Описание -->
            <UFormField required label="Краткое описание" class="space-y-3">
              <UTextarea
                v-model="newPost.description"
                placeholder="Введите краткое описание"
                :rows="4"
                class="w-full"
              />
            </UFormField>

            <!-- URL-адрес -->
            <UFormField label="URL-адрес" class="space-y-3">
              <UInput
                v-model="newPost.slug"
                placeholder="example-slug"
                class="w-full"
              />
            </UFormField>

            <!-- Редактор контента -->
            <UFormField required label="Содержание новости" class="space-y-3">
              <div
                class="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden"
              >
                <rich-editor v-model="newPost.content" />
              </div>
            </UFormField>
          </div>
        </div>
      </UForm>
    </div>
  </div>
</template>

<script setup lang="ts">
import dayjs from 'dayjs';
import { usePostApi } from '~~/services/api/post.api';
import { useTagApi } from '~~/services/api/tag.api';
import { useDepartmentApi } from '~~/services/api/department.api';
import type { File } from '~~/services/types/file.type';

const route = useRoute();
const toast = useToast();

const postApi = usePostApi();
const tagApi = useTagApi();
const departmentApi = useDepartmentApi();

const { slug } = route.params;

const publishedAt = shallowRef();
const fileUpload = ref();
const newPreview = reactive({
  path: '',
  id: '',
});

const newPost = reactive({
  title: '',
  description: '',
  content: '',
  publishedAt: publishedAt,
  slug: '',
  tags: [],
  departmentId: '',
  isDeleted: false,
  isPinned: false,
  previewFileId: '',
});

const { data: tags } = await tagApi.getAllTags({ limit: 100 });
const { data: departments } = await departmentApi.getAllDepartments();

if (slug) {
  const { data } = await postApi.getOnePost(slug as string);
  newPreview.path = data.preview.path;

  Object.keys(newPost).forEach((key: any) => {
    if (key === 'tags') {
      data.tags.forEach((tag: any) => {
        newPost.tags.push(tag.id);
      });
    } else {
      newPost[key] = data[key];
    }
  });
}

const uploadImage = async () => {
  if (fileUpload.value) {
    const body = new FormData();
    body.append('file', fileUpload.value);

    const res: File = await $fetch(
      'http://localhost:3333/api/files/upload/image',
      {
        method: 'POST',
        body,
      }
    );
    newPreview.id = res.id;
    newPreview.path = res.path;
  }
};

const updatePost = async () => {
  try {
    await postApi.updatePost(slug as string, {
      ...newPost,
      previewFileId: newPreview.id || newPost.previewFileId,
      publishedAt: new Date(),
    });
    toast.add({ title: 'Пост успешно обновлен', color: 'success' });
    navigateTo('/post');
  } catch {
    toast.add({ title: 'Произошла ошибка', color: 'error' });
  }
};

const createPost = async () => {
  try {
    await postApi.createPost({
      ...newPost,
      previewFileId: newPreview.id,
      publishedAt: publishedAt.value || new Date(),
    });
    toast.add({ title: 'Пост успешно создан', color: 'success' });
    navigateTo('/post');
  } catch {
    toast.add({ title: 'Произошла ошибка', color: 'error' });
  }
};
</script>
