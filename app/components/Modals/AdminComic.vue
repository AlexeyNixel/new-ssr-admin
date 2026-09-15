<script setup lang="ts">
import UploadImages from '~/components/Ui/UploadImages.vue';
import SelectComicGenre from '~/components/Ui/SelectComicGenre.vue';
import SelectComicSeries from '~/components/Ui/SelectComicSeries.vue';
import type { Comic } from '~~/services/types/comic.type';
import { useComicApi } from '~~/services/api/comic.api';
import { comicSchema } from '~/schemas/comic.schema';

const emit = defineEmits(['close']);
const props = defineProps<{
  comic?: Comic;
}>();

const toast = useToast();
const comicApi = useComicApi();

const { entity: comic, pending, notFound } = useModalEntity({
  prop: props.comic,
  fetchById: (id) => comicApi.getOneComic(id),
});
const isUpdate = computed(() => !!comic.value);

const newComic = ref({
  title: '',
  description: '',
  content: '',
  author: '',
  illustrator: '',
  volumeNumber: undefined as number | undefined,
  year: undefined as number | undefined,
  ageRating: undefined as number | undefined,
  externalLink: '',
  isDeleted: false,
  seriesId: undefined as string | undefined,
  imageFileIds: [] as string[],
  genreIds: [] as string[],
});

const imagePreviews = ref<{ id: string; path: string }[]>([]);

watch(
  comic,
  (value) => {
    if (!value) return;
    newComic.value = {
      title: value.title || '',
      description: value.description || '',
      content: value.content || '',
      author: value.author || '',
      illustrator: value.illustrator || '',
      volumeNumber: value.volumeNumber ?? undefined,
      year: value.year ?? undefined,
      ageRating: value.ageRating ?? undefined,
      externalLink: value.externalLink || '',
      isDeleted: value.isDeleted || false,
      seriesId: value.seriesId || undefined,
      imageFileIds: value.images.map((image) => image.fileId),
      genreIds: value.genres.map(({ genre }) => genre.id),
    };
    imagePreviews.value = value.images.map((image) => ({
      id: image.fileId,
      path: image.file.path,
    }));
  },
  { immediate: true }
);

const onSubmit = async () => {
  if (isUpdate.value && comic.value) {
    await comicApi.updateComic(comic.value.id, newComic.value);
    toast.add({ title: 'Комикс обновлён' });
  } else {
    await comicApi.createComic(newComic.value);
    toast.add({ title: 'Комикс создан' });
  }

  emit('close', true);
};
</script>

<template>
  <UModal
    :title="isUpdate ? 'Редактирование комикса' : 'Создание комикса'"
    :description="
      isUpdate
        ? 'Внесите изменения в информацию о комиксе'
        : 'Заполните информацию о новом комиксе'
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
          :schema="comicSchema"
          :state="newComic"
          class="space-y-5"
          @submit="onSubmit"
        >
          <UFormField label="Изображения (до 3)">
            <UploadImages
              v-model="newComic.imageFileIds"
              :previews="imagePreviews"
            />
          </UFormField>

          <UFormField name="title" label="Название комикса" required>
            <UInput
              v-model="newComic.title"
              class="w-full"
              placeholder="Введите название"
              icon="i-heroicons-book-open"
              size="md"
            />
          </UFormField>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
            <UFormField name="author" label="Сценарист">
              <UInput v-model="newComic.author" class="w-full" />
            </UFormField>
            <UFormField name="illustrator" label="Художник">
              <UInput v-model="newComic.illustrator" class="w-full" />
            </UFormField>
          </div>

          <UFormField name="description" label="Краткое описание">
            <UTextarea
              v-model="newComic.description"
              class="w-full"
              placeholder="Одна-две фразы для карточки..."
              :rows="3"
              size="md"
            />
          </UFormField>

          <UFormField name="content" label="Полное описание">
            <div
              class="border border-neutral-200 dark:border-neutral-700 rounded-lg overflow-hidden"
            >
              <EditorCustom v-model="newComic.content" class="w-full" />
            </div>
          </UFormField>

          <div class="grid grid-cols-2 md:grid-cols-4 gap-5">
            <UFormField name="volumeNumber" label="Номер тома/выпуска">
              <UInput
                v-model="newComic.volumeNumber"
                type="number"
                min="1"
                class="w-full"
              />
            </UFormField>
            <UFormField name="year" label="Год издания">
              <UInput
                v-model="newComic.year"
                type="number"
                min="1900"
                class="w-full"
              />
            </UFormField>
            <UFormField name="ageRating" label="Возрастной рейтинг">
              <UInput
                v-model="newComic.ageRating"
                type="number"
                min="0"
                placeholder="16"
                class="w-full"
              />
            </UFormField>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
            <UFormField label="Жанры">
              <SelectComicGenre v-model="newComic.genreIds" />
            </UFormField>
            <UFormField label="Серия">
              <SelectComicSeries v-model="newComic.seriesId" />
            </UFormField>
          </div>

          <UFormField name="externalLink" label="Ссылка на источник (чтение/покупка)">
            <UInput
              v-model="newComic.externalLink"
              placeholder="https://..."
              icon="i-heroicons-link"
              class="w-full"
            />
          </UFormField>

          <UFormField label="Настройки">
            <div
              class="p-4 bg-neutral-50 dark:bg-neutral-800/50 rounded-xl border border-neutral-200 dark:border-neutral-700"
            >
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <UIcon
                    :name="
                      newComic.isDeleted
                        ? 'i-heroicons-eye-slash-20-solid'
                        : 'i-heroicons-eye-20-solid'
                    "
                    class="w-4 h-4"
                    :class="
                      newComic.isDeleted ? 'text-neutral-500' : 'text-green-500'
                    "
                  />
                  <p class="text-sm font-medium text-neutral-900 dark:text-white">
                    Видимость в каталоге
                  </p>
                </div>
                <USwitch v-model="newComic.isDeleted" />
              </div>
              <p class="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                {{
                  newComic.isDeleted
                    ? 'Скрыт от пользователей'
                    : 'Виден всем пользователям'
                }}
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
              {{ isUpdate ? 'Обновить комикс' : 'Создать комикс' }}
            </UButton>
          </div>
        </UForm>
      </div>
    </template>
  </UModal>
</template>
