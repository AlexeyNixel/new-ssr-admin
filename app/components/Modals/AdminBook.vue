<script setup lang="ts">
import UploadImage from '~/components/Ui/UploadImage.vue';
import type { Book } from '~~/services/types/book.type';
import { useBookApi } from '~~/services/api/book.api';
import { z } from 'zod';
import SelectCollection from '~/components/Ui/SelectCollection.vue';

const emit = defineEmits(['close', 'saved']);
const props = defineProps<{
  book?: Book;
}>();

const places = [
  'Отдел отраслевой литературы',
  'Отдел литературных программ (детский сектор)',
  'Отдел литературных программ (цоколь)',
  'Центр организации образовательных программ',
];

const toast = useToast();

const bookApi = useBookApi();
const newBook = ref({
  title: props.book?.title || '',
  description: props.book?.description || '',
  content: props.book?.content || '',
  previewFileId: props.book?.previewFileId || '',
  isDeleted: props.book?.isDeleted || false,
  isVideo: props.book?.isVideo || false,
  place: props.book?.place || '',
  litresLink: props.book?.litresLink || '',
  collections: [],
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
  previewFileId: z.string('Обязательное поле').min(1, 'Обязательное поле'),
  place: z
    .string('Обязательное поле')
    .min(1, 'Обязательное поле')
    .transform((val) => val.trim())
    .pipe(
      z
        .string()
        .min(3, 'Должно быть минимум 3 символов')
        .refine((val) => val.length > 0)
    ),
  litresLink: z
    .string('Обязательное поле')
    .min(1, 'Обязательное поле')
    .transform((val) => val.trim())
    .pipe(
      z
        .string()
        .min(8, 'Должно быть минимум 8 символов')
        .refine((val) => val.length > 0)
    ),
});

const onSubmit = async () => {
  if (props.book) {
    await bookApi.updateBook(props.book.id, newBook.value);
    toast.add({ title: 'Книга обновлена' });
  } else {
    await bookApi.createBook(newBook.value);
    toast.add({ title: 'Книга создана' });
  }

  emit('close', true);
};

const handleCancel = async () => {
  emit('close');
};
</script>

<template>
  <UModal
    title="Обновление"
    description="Книги"
    :dismissible="false"
    :ui="{ content: 'sm:max-w-4xl' }"
  >
    <template #content>
      <div class="p-6">
        <!-- Заголовок -->
        <div class="mb-6">
          <h1 class="text-2xl font-bold text-gray-900">
            {{ book ? 'Редактирование книги' : 'Создание книги' }}
          </h1>
          <p class="text-gray-600 mt-1 text-sm">
            {{
              book
                ? 'Внесите изменения в информацию о книге'
                : 'Заполните информацию о новой книге'
            }}
          </p>
        </div>

        <!-- Форма -->
        <UForm
          class="space-y-6"
          :schema="schema"
          :state="newBook"
          @submit="onSubmit"
        >
          <!-- Основная информация -->
          <div class="space-y-4">
            <div class="flex items-center justify-between gap-5">
              <UFormField
                name="previewFileId"
                label="Обложка книги"
                class="space-y-3"
              >
                <UploadImage
                  v-model="newBook.previewFileId"
                  :preview="book?.preview?.path"
                  class="w-full"
                />
                <template #help>
                  <p class="text-xs text-gray-500">
                    Рекомендуемый размер: 600×900px • Форматы: JPG, PNG, WebP
                  </p>
                </template>
              </UFormField>
              <div class="w-full h-full flex flex-col justify-between">
                <UFormField name="title" label="Название книги" required>
                  <UInput
                    v-model="newBook.title"
                    class="w-full"
                    placeholder="Введите название книги"
                    icon="i-heroicons-bookmark"
                    size="lg"
                  />
                </UFormField>

                <UFormField
                  name="description"
                  label="Краткое описание"
                  required
                >
                  <UTextarea
                    v-model="newBook.description"
                    class="w-full"
                    placeholder="Опишите краткое содержание книги..."
                    :rows="3"
                  />
                </UFormField>
              </div>
            </div>

            <UFormField name="content" label="Полное содержание" required>
              <div
                class="ckeditor-container border border-gray-200 rounded-lg overflow-hidden"
              >
                <rich-editor v-model="newBook.content" class="w-full" />
              </div>
              <template #help>
                <p class="text-xs text-gray-500 mt-2">
                  Используйте редактор для форматирования текста. Редактор
                  автоматически подстраивается под размеры модального окна.
                </p>
              </template>
            </UFormField>
          </div>

          <!-- Обложка книги -->

          <!-- Дополнительная информация -->
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <UFormField required name="place" label="Место хранения">
              <USelect
                v-model="newBook.place"
                :items="places"
                class="w-full"
                placeholder="Отдел отраслевой литературы"
              />
            </UFormField>

            <UFormField required name="litresLink" label="Ссылка на Litres">
              <UInput
                v-model="newBook.litresLink"
                placeholder="https://litres.ru/..."
                icon="i-heroicons-shopping-cart"
                class="w-full"
              />
            </UFormField>
            <UFormField required name="collection" label="Выбирите коллекцию">
              <SelectCollection v-model="newBook.collections" />
            </UFormField>
          </div>

          <!-- Настройки -->
          <div class="space-y-4">
            <div
              class="p-4 bg-gray-50 rounded-lg border border-gray-200 space-y-4"
            >
              <UFormField label="Настройки книги">
                <div class="space-y-3">
                  <div class="flex items-center justify-between">
                    <div class="space-y-1">
                      <p class="text-sm font-medium text-gray-900">
                        Статус книги
                      </p>
                      <p class="text-xs text-gray-500">
                        {{
                          newBook.isDeleted
                            ? 'Скрыта от пользователей'
                            : 'Видна всем пользователям'
                        }}
                      </p>
                    </div>
                    <USwitch
                      v-model="newBook.isDeleted"
                      :label="newBook.isDeleted ? 'Скрыта' : 'Активна'"
                    />
                  </div>

                  <div class="flex items-center justify-between">
                    <div class="space-y-1">
                      <p class="text-sm font-medium text-gray-900">
                        Тип контента
                      </p>
                      <p class="text-xs text-gray-500">
                        {{
                          newBook.isVideo ? 'Видео-материал' : 'Текстовая книга'
                        }}
                      </p>
                    </div>
                    <USwitch
                      v-model="newBook.isVideo"
                      :label="newBook.isVideo ? 'Видео' : 'Книга'"
                    />
                  </div>
                </div>
              </UFormField>
            </div>
          </div>

          <!-- Кнопки действий -->
          <div
            class="flex flex-col sm:flex-row gap-3 pt-6 border-t border-gray-200"
          >
            <UButton
              variant="outline"
              color="neutral"
              class="flex-1"
              @click="handleCancel"
            >
              Отмена
            </UButton>
            <UButton color="primary" class="flex-1" type="submit">
              {{ book ? 'Обновить книгу' : 'Создать книгу' }}
            </UButton>
          </div>
        </UForm>
      </div>
    </template>
  </UModal>
</template>
