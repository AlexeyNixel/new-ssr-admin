<script setup lang="ts">
import UploadImages from '~/components/Ui/UploadImages.vue';
import UploadDocument from '~/components/Ui/UploadDocument.vue';
import SelectGenre from '~/components/Ui/SelectGenre.vue';
import SelectSeries from '~/components/Ui/SelectSeries.vue';
import type { Game } from '~~/services/types/game.type';
import { GAME_STATUS_OPTIONS } from '~~/services/types/game.type';
import { useGameApi } from '~~/services/api/game.api';
import { gameSchema } from '~/schemas/game.schema';

const emit = defineEmits(['close']);
const props = defineProps<{
  game?: Game;
}>();

const toast = useToast();
const gameApi = useGameApi();

const { entity: game, pending, notFound } = useModalEntity({
  prop: props.game,
  fetchById: (id) => gameApi.getOneGame(id),
});
const isUpdate = computed(() => !!game.value);

const newGame = ref({
  title: '',
  shortDescription: '',
  description: '',
  playerMin: undefined as number | undefined,
  playerMax: undefined as number | undefined,
  playerAge: undefined as number | undefined,
  durationMin: undefined as number | undefined,
  durationMax: undefined as number | undefined,
  year: undefined as number | undefined,
  status: 'IN_STOCK',
  place: '',
  comment: '',
  videoUrl: '',
  isDeleted: false,
  seriesId: undefined as string | undefined,
  rulesFileId: undefined as string | undefined,
  imageFileIds: [] as string[],
  genreIds: [] as string[],
});

const imagePreviews = ref<{ id: string; path: string }[]>([]);

watch(
  game,
  (value) => {
    if (!value) return;
    newGame.value = {
      title: value.title || '',
      shortDescription: value.shortDescription || '',
      description: value.description || '',
      playerMin: value.playerMin ?? undefined,
      playerMax: value.playerMax ?? undefined,
      playerAge: value.playerAge ?? undefined,
      durationMin: value.durationMin ?? undefined,
      durationMax: value.durationMax ?? undefined,
      year: value.year ?? undefined,
      status: value.status || 'IN_STOCK',
      place: value.place || '',
      comment: value.comment || '',
      videoUrl: value.videoUrl || '',
      isDeleted: value.isDeleted || false,
      seriesId: value.seriesId || undefined,
      rulesFileId: value.rulesFileId || undefined,
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
  if (isUpdate.value && game.value) {
    await gameApi.updateGame(game.value.id, newGame.value);
    toast.add({ title: 'Игра обновлена' });
  } else {
    await gameApi.createGame(newGame.value);
    toast.add({ title: 'Игра создана' });
  }

  emit('close', true);
};
</script>

<template>
  <UModal
    :title="isUpdate ? 'Редактирование игры' : 'Создание игры'"
    :description="
      isUpdate
        ? 'Внесите изменения в информацию об игре'
        : 'Заполните информацию о новой игре'
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
          :schema="gameSchema"
          :state="newGame"
          class="space-y-5"
          @submit="onSubmit"
        >
          <UFormField label="Изображения (до 3)">
            <UploadImages
              v-model="newGame.imageFileIds"
              :previews="imagePreviews"
            />
          </UFormField>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
            <UFormField name="title" label="Название игры" required>
              <UInput
                v-model="newGame.title"
                class="w-full"
                placeholder="Введите название игры"
                icon="i-heroicons-puzzle-piece"
                size="md"
              />
            </UFormField>

            <UFormField name="status" label="Статус" required>
              <USelect
                v-model="newGame.status"
                :items="GAME_STATUS_OPTIONS"
                label-key="label"
                value-key="value"
                class="w-full"
              />
            </UFormField>
          </div>

          <UFormField name="shortDescription" label="Краткое описание">
            <UTextarea
              v-model="newGame.shortDescription"
              class="w-full"
              placeholder="Одна-две фразы для карточки игры..."
              :rows="2"
              size="md"
            />
          </UFormField>

          <UFormField name="description" label="Полное описание">
            <div
              class="border border-neutral-200 dark:border-neutral-700 rounded-lg overflow-hidden"
            >
              <EditorCustom v-model="newGame.description" class="w-full" />
            </div>
          </UFormField>

          <div class="grid grid-cols-2 md:grid-cols-4 gap-5">
            <UFormField name="playerMin" label="Игроков от">
              <UInput
                v-model="newGame.playerMin"
                type="number"
                min="1"
                class="w-full"
              />
            </UFormField>
            <UFormField name="playerMax" label="Игроков до">
              <UInput
                v-model="newGame.playerMax"
                type="number"
                min="1"
                class="w-full"
              />
            </UFormField>
            <UFormField name="playerAge" label="Возраст">
              <UInput
                v-model="newGame.playerAge"
                type="number"
                min="0"
                class="w-full"
              />
            </UFormField>
            <UFormField name="year" label="Год издания">
              <UInput
                v-model="newGame.year"
                type="number"
                min="1900"
                class="w-full"
              />
            </UFormField>
            <UFormField name="durationMin" label="Партия от, мин">
              <UInput
                v-model="newGame.durationMin"
                type="number"
                min="1"
                class="w-full"
              />
            </UFormField>
            <UFormField name="durationMax" label="Партия до, мин">
              <UInput
                v-model="newGame.durationMax"
                type="number"
                min="1"
                class="w-full"
              />
            </UFormField>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
            <UFormField label="Жанры">
              <SelectGenre v-model="newGame.genreIds" />
            </UFormField>
            <UFormField label="Серия">
              <SelectSeries v-model="newGame.seriesId" />
            </UFormField>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
            <UFormField name="videoUrl" label="Ссылка на видео">
              <UInput
                v-model="newGame.videoUrl"
                placeholder="https://..."
                icon="i-heroicons-play-circle"
                class="w-full"
              />
            </UFormField>
            <UFormField label="Файл с правилами (PDF)">
              <UploadDocument
                v-model="newGame.rulesFileId"
                :preview="game?.rulesFile?.path"
              />
            </UFormField>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
            <UFormField name="place" label="Место хранения">
              <UInput v-model="newGame.place" class="w-full" />
            </UFormField>
            <UFormField name="comment" label="Комментарий">
              <UInput v-model="newGame.comment" class="w-full" />
            </UFormField>
          </div>

          <UFormField label="Настройки">
            <div
              class="p-4 bg-neutral-50 dark:bg-neutral-800/50 rounded-xl border border-neutral-200 dark:border-neutral-700"
            >
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <UIcon
                    :name="
                      newGame.isDeleted
                        ? 'i-heroicons-eye-slash-20-solid'
                        : 'i-heroicons-eye-20-solid'
                    "
                    class="w-4 h-4"
                    :class="
                      newGame.isDeleted ? 'text-neutral-500' : 'text-green-500'
                    "
                  />
                  <p class="text-sm font-medium text-neutral-900 dark:text-white">
                    Видимость в каталоге
                  </p>
                </div>
                <USwitch v-model="newGame.isDeleted" />
              </div>
              <p class="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                {{
                  newGame.isDeleted
                    ? 'Скрыта от пользователей'
                    : 'Видна всем пользователям'
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
              {{ isUpdate ? 'Обновить игру' : 'Создать игру' }}
            </UButton>
          </div>
        </UForm>
      </div>
    </template>
  </UModal>
</template>
