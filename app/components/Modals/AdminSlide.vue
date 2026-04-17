<script setup lang="ts">
import type { Slide } from '~~/services/types/slide.type';
import { useSlideApi } from '~~/services/api/slide.api';
import { slideSchema } from '~/schemas/slide.schema';

const emit = defineEmits<{ close: [boolean] }>();
const props = defineProps<{
  slide?: Slide;
}>();

const slideApi = useSlideApi();
const toast = useToast();

const schema = slideSchema;

const newSlides = ref({
  imageFileId: props.slide?.imageFileId || '',
  postId: props.slide?.postId || undefined,
  isDeleted: props.slide?.isDeleted || false,
  slideOrder: props.slide?.slideOrder || 0,
  url: props.slide?.url || '',
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
  <UModal
    :dismissible="false"
    :title="slide ? 'Редактирование слайда' : 'Создание слайда'"
    :description="
      slide
        ? 'Внесите изменения в существующий слайд'
        : 'Заполните информацию для нового слайда'
    "
  >
    <template #body>
      <div class="flex flex-col w-full">
        <!-- Форма -->
        <UForm
          :schema="schema"
          :state="newSlides"
          class="space-y-5"
          @submit="onSubmit"
        >
          <!-- Загрузка изображения -->
          <UFormField name="imageFileId" label="Изображение слайда">
            <UiUploadImage
              v-model="newSlides.imageFileId"
              :preview="slide?.image?.path"
              class="w-full"
            />
            <p class="text-xs text-neutral-500 dark:text-neutral-400">
              Рекомендуемое соотношение: 2:1 (1800x900) • Максимальный вес: 5MB
            </p>
          </UFormField>

          <!-- Группа полей в строку -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
            <!-- Привязанная новость -->
            <UFormField name="postId" label="Привязанная новость">
              <UInput
                v-model="newSlides.postId"
                placeholder="Введите ID новости"
                icon="i-heroicons-newspaper"
                class="w-full"
                size="md"
              />
              <p class="text-xs text-neutral-500 dark:text-neutral-400">
                Укажите идентификатор связанной новости
              </p>
            </UFormField>

            <!-- Порядок слайда -->
            <UFormField label="Порядок отображения">
              <UInput
                v-model="newSlides.slideOrder"
                type="number"
                placeholder="0"
                min="0"
                icon="i-heroicons-list-bullet"
                class="w-full"
                size="md"
              />
              <p class="text-xs text-neutral-500 dark:text-neutral-400">
                Чем меньше число, тем выше в списке
              </p>
            </UFormField>
          </div>

          <!-- Внешняя ссылка (новое поле) -->
          <UFormField name="url" label="Внешняя ссылка">
            <UInput
              v-model="newSlides.url"
              placeholder="https://example.com"
              icon="i-heroicons-link-20-solid"
              class="w-full"
              size="md"
            />
            <p class="text-xs text-neutral-500 dark:text-neutral-400">
              Если указана, при клике на слайд будет переход на внешний сайт.
              Приоритет выше, чем у привязанной новости
            </p>
          </UFormField>

          <!-- Статус слайда -->
          <UFormField label="Статус слайда">
            <div
              class="p-4 bg-neutral-50 dark:bg-neutral-800/50 rounded-xl border border-neutral-200 dark:border-neutral-700"
            >
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <UIcon
                    :name="
                      newSlides.isDeleted
                        ? 'i-heroicons-eye-slash-20-solid'
                        : 'i-heroicons-eye-20-solid'
                    "
                    class="w-4 h-4"
                    :class="
                      newSlides.isDeleted
                        ? 'text-neutral-500'
                        : 'text-green-500'
                    "
                  />
                  <p
                    class="text-sm font-medium text-neutral-900 dark:text-white"
                  >
                    {{ newSlides.isDeleted ? 'Слайд скрыт' : 'Слайд активен' }}
                  </p>
                </div>
                <UCheckbox
                  v-model="newSlides.isDeleted"
                  :label="newSlides.isDeleted ? 'Скрыт' : 'Активен'"
                  color="primary"
                />
              </div>
            </div>
            <p class="text-xs text-neutral-500 dark:text-neutral-400">
              {{
                newSlides.isDeleted
                  ? 'Слайд скрыт из публичного доступа'
                  : 'Слайд отображается на сайте'
              }}
            </p>
          </UFormField>

          <!-- Кнопки действий -->
          <div
            class="flex items-center justify-end gap-3 pt-4 mt-2 border-t border-neutral-200 dark:border-neutral-700"
          >
            <UButton
              type="submit"
              color="primary"
              size="md"
              class="min-w-[160px]"
              :loading="isLoading"
              :icon="
                slide
                  ? 'i-heroicons-pencil-square-20-solid'
                  : 'i-heroicons-plus-20-solid'
              "
            >
              {{ slide ? 'Сохранить изменения' : 'Создать слайд' }}
            </UButton>
          </div>
        </UForm>
      </div>
    </template>
  </UModal>
</template>

<style scoped></style>
