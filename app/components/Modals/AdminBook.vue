<script setup lang="ts">
import UploadImage from '~/components/Ui/UploadImage.vue';
import type { Book } from '~~/services/types/book.type';

const props = defineProps<{
  book?: Book;
}>();

const newBook = ref({
  title: props.book?.title || '',
  description: props.book?.description || '',
  content: props.book?.content || '',
  previewFileId: props.book?.previewFileId || '',
  isDeleted: props.book?.isDeleted || false,
  isVideo: props.book?.isVideo || false,
  place: props.book?.place || '',
  litresLink: props.book?.litresLink || '',
});

const emit = defineEmits(['close', 'saved']);

const handleSubmit = () => {
  console.log('Создание книги:', newBook.value);
  emit('saved');
};

const handleCancel = () => {
  emit('close');
};
</script>

<template>
  <UModal
    title="Обновление"
    description="Книги"
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
        <UForm class="space-y-6">
          <!-- Основная информация -->
          <div class="space-y-4">
            <div class="flex items-center justify-between gap-5">
              <UFormField label="Обложка книги" class="space-y-3">
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
                <UFormField label="Название книги" required>
                  <UInput
                    v-model="newBook.title"
                    class="w-full"
                    placeholder="Введите название книги"
                    icon="i-heroicons-bookmark"
                    size="lg"
                  />
                </UFormField>

                <UFormField label="Краткое описание" required>
                  <UTextarea
                    v-model="newBook.description"
                    class="w-full"
                    placeholder="Опишите краткое содержание книги..."
                    :rows="3"
                  />
                </UFormField>
              </div>
            </div>

            <UFormField label="Полное содержание" required>
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
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <UFormField label="Место издания">
              <UInput
                v-model="newBook.place"
                placeholder="Город, издательство"
                icon="i-heroicons-map-pin"
              />
            </UFormField>

            <UFormField label="Ссылка на Litres">
              <UInput
                v-model="newBook.litresLink"
                placeholder="https://litres.ru/..."
                icon="i-heroicons-shopping-cart"
              />
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
            <UButton color="primary" class="flex-1" @click="handleSubmit">
              {{ book ? 'Обновить книгу' : 'Создать книгу' }}
            </UButton>
          </div>
        </UForm>
      </div>
    </template>
  </UModal>
</template>

<style scoped>
/* Контейнер для CKEditor с ограничением высоты и скроллом */
.ckeditor-container {
  max-height: 400px;
  min-height: 200px;
}

/* Стили для CKEditor внутри модалки */
:deep(.ck.ck-editor) {
  max-width: 100%;
}

:deep(.ck.ck-editor__editable) {
  min-height: 200px;
  max-height: 350px;
  overflow-y: auto;
  border: none !important;
  border-radius: 0 !important;
}

:deep(.ck.ck-toolbar) {
  border: none !important;
  border-bottom: 1px solid #e5e7eb !important;
  border-radius: 0 !important;
  background: #f9fafb !important;
}

/* Убираем тени и бордеры у редактора */
:deep(.ck.ck-editor__main) {
  border: none !important;
}

:deep(.ck.ck-content) {
  border: none !important;
  padding: 1rem !important;
}

/* Адаптивность для мобильных */
@media (max-width: 640px) {
  .ckeditor-container {
    max-height: 300px;
    min-height: 150px;
  }

  :deep(.ck.ck-editor__editable) {
    min-height: 150px;
    max-height: 250px;
  }

  :deep(.ck.ck-toolbar__items) {
    flex-wrap: wrap;
    gap: 0.25rem;
  }

  :deep(.ck.ck-toolbar .ck-toolbar__separator) {
    display: none;
  }
}

/* Плавные переходы для всех элементов */
:deep(.u-input),
:deep(.u-textarea) {
  transition: all 0.2s ease-in-out;
}

:deep(.u-button) {
  transition: all 0.2s ease-in-out;
}
</style>
