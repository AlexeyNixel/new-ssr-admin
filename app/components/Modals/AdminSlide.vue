<script setup lang="ts">
import type { Slide } from '~~/services/types/slide.type';
import { useSlideApi } from '~~/services/api/slide.api';

const emit = defineEmits<{ close: [boolean] }>();
const props = defineProps<{
  slide?: Slide;
}>();

const slideApi = useSlideApi();
const toast = useToast();

const newSlides = ref({
  imageFileId: props.slide?.imageFileId || '',
  postId: props.slide?.postId || undefined,
  isDeleted: props.slide?.isDeleted || false,
  slideOrder: props.slide?.slideOrder || 0,
});

const onSubmit = async () => {
  if (!newSlides.value.postId) {
    delete newSlides.value.postId;
  }

  if (props.slide) {
    await slideApi.updateSlide(props.slide?.id, newSlides.value);
  } else {
    await slideApi.createSlide(newSlides.value);
  }

  toast.add({ title: props.slide ? 'Слайд обновлен' : 'Слайд создан' });
  emit('close', true);
};
</script>

<template>
  <UModal title="Создание слайда" description="Отсутствует">
    <template #content>
      <div class="p-6">
        <!-- Заголовок -->
        <div class="mb-6">
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
            {{ slide ? 'Редактирование слайда' : 'Создание слайда' }}
          </h1>
          <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">
            {{
              slide
                ? 'Внесите изменения в существующий слайд'
                : 'Заполните информацию для нового слайда'
            }}
          </p>
        </div>

        <!-- Форма -->
        <UForm class="space-y-6">
          <!-- Загрузка изображения -->
          <UFormField label="Изображение слайда" name="image" class="space-y-3">
            <div class="flex flex-col items-center justify-center space-y-3">
              <UiUploadImage
                v-model="newSlides.imageFileId"
                :preview="slide?.image?.path"
                class="w-full"
              />
              <p class="text-xs text-gray-500 dark:text-gray-400 text-center">
                Рекомендуемый размер: 1920×1080px • Максимальный вес: 5MB
              </p>
            </div>
          </UFormField>

          <!-- Группа полей в строку -->
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <!-- Привязанная новость -->
            <UFormField
              label="Привязанная новость"
              name="postId"
              class="space-y-2"
            >
              <UInput
                v-model="newSlides.postId"
                placeholder="Введите ID новости"
                icon="i-heroicons-newspaper"
                class="w-full"
              />
              <p class="text-xs text-gray-500 dark:text-gray-400">
                Укажите идентификатор связанной новости
              </p>
            </UFormField>

            <!-- Порядок слайда -->
            <UFormField
              label="Порядок отображения"
              name="slideOrder"
              class="space-y-2"
            >
              <UInput
                v-model="newSlides.slideOrder"
                type="number"
                placeholder="0"
                min="0"
                icon="i-heroicons-list-bullet"
                class="w-full"
              />
              <p class="text-xs text-gray-500 dark:text-gray-400">
                Чем меньше число, тем выше в списке
              </p>
            </UFormField>
          </div>

          <!-- Статус -->
          <div
            class="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
          >
            <UFormField
              label="Статус слайда"
              name="isDeleted"
              class="space-y-3"
            >
              <div class="flex items-center justify-between">
                <div class="space-y-1">
                  <p class="text-sm font-medium text-gray-900 dark:text-white">
                    {{ newSlides.isDeleted ? 'Скрыт' : 'Активен' }}
                  </p>
                  <p class="text-xs text-gray-500 dark:text-gray-400">
                    {{
                      newSlides.isDeleted
                        ? 'Слайд скрыт из публичного доступа'
                        : 'Слайд отображается на сайте'
                    }}
                  </p>
                </div>
                <UCheckbox
                  v-model="newSlides.isDeleted"
                  :label="newSlides.isDeleted ? 'Скрыт' : 'Активен'"
                  color="primary"
                />
              </div>
            </UFormField>
          </div>

          <!-- Разделитель и кнопки -->
          <div class="border-t border-gray-200 dark:border-gray-700 pt-6">
            <div class="flex flex-col sm:flex-row justify-end gap-3">
              <UButton
                variant="outline"
                color="neutral"
                class="flex-1 sm:flex-none order-2 sm:order-1"
                @click="$emit('close', false)"
              >
                Отмена
              </UButton>
              <UButton
                color="primary"
                class="flex-1 sm:flex-none order-1 sm:order-2"
                :label="slide ? 'Сохранить изменения' : 'Создать слайд'"
                @click="onSubmit"
              />
            </div>
          </div>
        </UForm>
      </div>
    </template>
  </UModal>
</template>

<style scoped></style>
