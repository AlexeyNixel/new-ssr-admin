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

const { entity: book, pending, notFound } = useModalEntity({
  prop: props.book,
  fetchById: (id) => bookApi.getOneBook(id),
});
const isUpdate = computed(() => !!book.value);

const newBook = ref({
  title: '',
  description: '',
  content: '',
  previewFileId: '',
  isDeleted: false,
  isVideo: false,
  place: '',
  litresLink: '',
  collections: [],
});

watch(
  book,
  (value) => {
    if (!value) return;
    newBook.value = {
      title: value.title || '',
      description: value.description || '',
      content: value.content || '',
      previewFileId: value.previewFileId || '',
      isDeleted: value.isDeleted || false,
      isVideo: value.isVideo || false,
      place: value.place || '',
      litresLink: value.litresLink || '',
      collections: [],
    };
  },
  { immediate: true }
);

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
  if (isUpdate.value && book.value) {
    await bookApi.updateBook(book.value.id, newBook.value);
    toast.add({ title: 'Книга обновлена' });
  } else {
    await bookApi.createBook(newBook.value);
    toast.add({ title: 'Книга создана' });
  }

  emit('close', true);
};
</script>

<template>
  <UModal
    :title="isUpdate ? 'Редактирование книги' : 'Создание книги'"
    :description="
      isUpdate
        ? 'Внесите изменения в информацию о книге'
        : 'Заполните информацию о новой книге'
    "
    :dismissible="false"
    :ui="{ content: 'sm:max-w-5xl' }"
  >
    <template #body>
      <div v-if="pending" class="flex items-center justify-center py-12">
        <UIcon
          name="i-heroicons-arrow-path"
          class="w-6 h-6 animate-spin text-neutral-400"
        />
      </div>

      <div
        v-else-if="notFound"
        class="py-12 text-center text-neutral-500 dark:text-neutral-400"
      >
        Запись не найдена
      </div>

      <div v-else class="flex flex-col w-full">
        <UForm
          :schema="schema"
          :state="newBook"
          class="space-y-5"
          @submit="onSubmit"
        >
          <div class="flex flex-col md:flex-row gap-6">
            <div class="md:w-1/3">
              <UFormField label="Обложка книги">
                <UploadImage
                  v-model="newBook.previewFileId"
                  :preview="book?.preview?.path"
                  class="w-full"
                />
                <p class="text-xs text-neutral-500 dark:text-neutral-400">
                  Рекомендуемый размер: 600×900px • Форматы: JPG, PNG, WebP
                </p>
              </UFormField>
            </div>

            <div class="md:w-2/3 space-y-5">
              <UFormField name="title" label="Название книги" required>
                <UInput
                  v-model="newBook.title"
                  class="w-full"
                  placeholder="Введите название книги"
                  icon="i-heroicons-bookmark"
                  size="md"
                />
              </UFormField>

              <UFormField name="description" label="Краткое описание" required>
                <UTextarea
                  v-model="newBook.description"
                  class="w-full"
                  placeholder="Опишите краткое содержание книги..."
                  :rows="3"
                  size="md"
                />
              </UFormField>
            </div>
          </div>

          <UFormField name="content" label="Полное содержание" required>
            <div
              class="border border-neutral-200 dark:border-neutral-700 rounded-lg overflow-hidden"
            >
              <EditorCustom v-model="newBook.content" class="w-full" />
            </div>
            <p class="text-xs text-neutral-500 dark:text-neutral-400">
              Используйте редактор для форматирования текста. Редактор
              автоматически подстраивается под размеры модального окна.
            </p>
          </UFormField>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-5">
            <UFormField name="place" label="Место хранения" required>
              <USelect
                v-model="newBook.place"
                :items="places"
                class="w-full"
                placeholder="Отдел отраслевой литературы"
              />
            </UFormField>

            <UFormField name="litresLink" label="Ссылка на Litres" required>
              <UInput
                v-model="newBook.litresLink"
                placeholder="https://litres.ru/..."
                icon="i-heroicons-shopping-cart"
                class="w-full"
              />
            </UFormField>

            <UFormField name="collection" label="Выберите коллекцию" required>
              <SelectCollection v-model="newBook.collections" />
            </UFormField>
          </div>

          <UFormField label="Настройки книги">
            <div
              class="p-4 bg-neutral-50 dark:bg-neutral-800/50 rounded-xl border border-neutral-200 dark:border-neutral-700 space-y-4"
            >
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <UIcon
                    :name="
                      newBook.isDeleted
                        ? 'i-heroicons-eye-slash-20-solid'
                        : 'i-heroicons-eye-20-solid'
                    "
                    class="w-4 h-4"
                    :class="
                      newBook.isDeleted ? 'text-neutral-500' : 'text-green-500'
                    "
                  />
                  <p
                    class="text-sm font-medium text-neutral-900 dark:text-white"
                  >
                    Статус книги
                  </p>
                </div>
                <USwitch v-model="newBook.isDeleted" />
              </div>
              <p class="text-xs text-neutral-500 dark:text-neutral-400">
                {{
                  newBook.isDeleted
                    ? 'Скрыта от пользователей'
                    : 'Видна всем пользователям'
                }}
              </p>

              <div class="flex items-center justify-between pt-2">
                <div class="flex items-center gap-2">
                  <UIcon
                    :name="
                      newBook.isVideo
                        ? 'i-heroicons-video-camera-20-solid'
                        : 'i-heroicons-book-open-20-solid'
                    "
                    class="w-4 h-4"
                    :class="
                      newBook.isVideo ? 'text-blue-500' : 'text-purple-500'
                    "
                  />
                  <p
                    class="text-sm font-medium text-neutral-900 dark:text-white"
                  >
                    Тип контента
                  </p>
                </div>
                <USwitch v-model="newBook.isVideo" />
              </div>
              <p class="text-xs text-neutral-500 dark:text-neutral-400">
                {{ newBook.isVideo ? 'Видео-материал' : 'Текстовая книга' }}
              </p>
            </div>
          </UFormField>

          <div
            class="flex items-center justify-end gap-3 pt-4 mt-2 border-t border-neutral-200 dark:border-neutral-700"
          >
            <UButton
              type="submit"
              color="primary"
              size="md"
              class="min-w-[160px]"
              :icon="
                isUpdate
                  ? 'i-heroicons-pencil-square-20-solid'
                  : 'i-heroicons-plus-20-solid'
              "
            >
              {{ isUpdate ? 'Обновить книгу' : 'Создать книгу' }}
            </UButton>
          </div>
        </UForm>
      </div>
    </template>
  </UModal>
</template>
