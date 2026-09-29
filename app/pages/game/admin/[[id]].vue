<script setup lang="ts">
import UploadImages from '~/components/Ui/UploadImages.vue';
import UploadDocument from '~/components/Ui/UploadDocument.vue';
import SelectGenre from '~/components/Ui/SelectGenre.vue';
import SelectSeries from '~/components/Ui/SelectSeries.vue';
import { useGameApi } from '~~/services/api/game.api';
import type { Game, GameStatus } from '~~/services/types/game.type';
import { GAME_STATUS_OPTIONS } from '~~/services/types/game.type';
import { gameSchema } from '~/schemas/game.schema';
import { htmlToText } from '~/schemas/post.schema';
import EditorCustom from '~/components/Editor/EditorCustom.vue';

const route = useRoute();
const gameId = route.params.id as string | undefined;
const isUpdate = !!gameId;

const toast = useToast();
const gameApi = useGameApi();

const form = reactive({
  title: '',
  shortDescription: '',
  description: '',
  playerMin: null as number | null,
  playerMax: null as number | null,
  playerAge: null as number | null,
  durationMin: null as number | null,
  durationMax: null as number | null,
  year: null as number | null,
  status: 'IN_STOCK' as GameStatus,
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

const loaded = ref<Game>();
const loadError = ref(false);

if (gameId) {
  try {
    const data = await gameApi.getOneGame(gameId);
    loaded.value = data;
    Object.assign(form, {
      title: data.title ?? '',
      shortDescription: data.shortDescription ?? '',
      description: data.description ?? '',
      playerMin: data.playerMin ?? null,
      playerMax: data.playerMax ?? null,
      playerAge: data.playerAge ?? null,
      durationMin: data.durationMin ?? null,
      durationMax: data.durationMax ?? null,
      year: data.year ?? null,
      status: data.status ?? 'IN_STOCK',
      place: data.place ?? '',
      comment: data.comment ?? '',
      videoUrl: data.videoUrl ?? '',
      isDeleted: !!data.isDeleted,
      seriesId: data.seriesId ?? undefined,
      rulesFileId: data.rulesFileId ?? undefined,
      imageFileIds: (data.images ?? []).map((image) => image.fileId),
      genreIds: (data.genres ?? []).map(({ genre }) => genre.id),
    });
    imagePreviews.value = (data.images ?? []).map((image) => ({
      id: image.fileId,
      path: image.file.path,
    }));
  } catch {
    loadError.value = true;
  }
}

const formRef = useTemplateRef('formRef');

const { isDirty, markSaved, onError } = useEntityForm({
  snapshot: () => form,
  submit: () => formRef.value?.submit(),
  fieldLabels: {
    title: 'Название',
    status: 'Наличие',
    playerMin: 'Игроков от',
    playerMax: 'Игроков до',
    playerAge: 'Возраст',
    durationMin: 'Партия от',
    durationMax: 'Партия до',
    year: 'Год издания',
    videoUrl: 'Ссылка на видео',
  },
});

const status = computed(() =>
  publicationStatus(isUpdate, form.isDeleted, { shown: 'Опубликована', hidden: 'Скрыта', created: 'Новая' })
);

const checklist = computed(() => [
  { label: 'Название', done: form.title.trim().length >= 2 },
  { label: 'Краткое описание', done: form.shortDescription.trim().length > 0 },
  { label: 'Полное описание', done: htmlToText(form.description).length > 0 },
  { label: 'Изображения', done: form.imageFileIds.length > 0 },
  { label: 'Количество игроков', done: form.playerMin != null || form.playerMax != null },
  { label: 'Жанры', done: form.genreIds.length > 0 },
]);

// ---------- Сохранение ----------

const saving = ref(false);

const onSubmit = async () => {
  if (saving.value) return;
  saving.value = true;

  const payload = {
    ...form,
    title: form.title.trim(),
    shortDescription: form.shortDescription.trim(),
    place: form.place.trim(),
    comment: form.comment.trim(),
    videoUrl: form.videoUrl.trim(),
    // очищенное числовое поле — undefined, а он выпадает из JSON: шлём null
    playerMin: form.playerMin ?? null,
    playerMax: form.playerMax ?? null,
    playerAge: form.playerAge ?? null,
    durationMin: form.durationMin ?? null,
    durationMax: form.durationMax ?? null,
    year: form.year ?? null,
  };

  try {
    if (isUpdate) {
      await gameApi.updateGame(gameId!, payload);
      toast.add({ title: 'Игра обновлена', color: 'success', icon: 'i-lucide-circle-check' });
    } else {
      await gameApi.createGame(payload);
      toast.add({ title: 'Игра создана', color: 'success', icon: 'i-lucide-circle-check' });
    }
    markSaved();
    await navigateTo('/game');
  } catch {
    toast.add({
      title: 'Не удалось сохранить игру',
      description: 'Проверьте соединение и попробуйте ещё раз',
      color: 'error',
    });
  } finally {
    saving.value = false;
  }
};

const focusDescription = () => document.getElementById('game-short-description')?.focus();

useHead({ title: isUpdate ? 'НОМБ | Редактирование игры' : 'НОМБ | Новая игра' });
</script>

<template>
  <div class="min-h-screen bg-muted [--editor-toolbar-top:4rem]">
    <EntityFormNotFound
      v-if="loadError"
      title="Игра не найдена"
      back-to="/game"
      back-label="К списку игр"
    />

    <UForm
      v-else
      ref="formRef"
      :schema="gameSchema"
      :state="form"
      @submit="onSubmit"
      @error="onError"
    >
      <EntityFormHeader
        back-to="/game"
        back-label="К списку игр"
        section="Настольные игры"
        :title="isUpdate ? form.title || 'Редактирование игры' : 'Новая игра'"
        :status="status"
        :is-dirty="isDirty"
        :saving="saving"
        :submit-label="isUpdate ? 'Сохранить' : 'Создать игру'"
      />

      <EntityFormBody>
        <section class="space-y-5 rounded-xl border border-default bg-default p-4 shadow-xs sm:p-6">
          <EntityFormTitleInput
            v-model="form.title"
            placeholder="Название игры"
            @enter="focusDescription"
          />

          <UFormField
            name="shortDescription"
            data-field="shortDescription"
            label="Краткое описание"
            description="Показывается в карточке игры в каталоге"
          >
            <UTextarea
              id="game-short-description"
              v-model="form.shortDescription"
              placeholder="Одна-две фразы об игре"
              autoresize
              :rows="2"
              :maxrows="8"
              class="w-full"
            />
          </UFormField>
        </section>

        <UFormField
          name="description"
          data-field="description"
          label="Полное описание"
          :ui="{ label: 'text-base font-semibold', container: 'mt-2' }"
        >
          <EditorCustom v-model="form.description" />
        </UFormField>

        <EntityFormCard title="Изображения" icon="i-lucide-images">
          <p class="-mt-2 text-xs text-muted">
            До трёх изображений, первое — обложка в каталоге
          </p>
          <UploadImages v-model="form.imageFileIds" :previews="imagePreviews" />
        </EntityFormCard>

        <EntityFormCard title="Параметры игры" icon="i-lucide-dices">
          <div class="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <UFormField name="playerMin" data-field="playerMin" label="Игроков от">
              <UInputNumber v-model="form.playerMin" :min="1" placeholder="—" class="w-full" />
            </UFormField>
            <UFormField name="playerMax" data-field="playerMax" label="Игроков до">
              <UInputNumber v-model="form.playerMax" :min="1" placeholder="—" class="w-full" />
            </UFormField>
            <UFormField name="durationMin" data-field="durationMin" label="Партия от, мин">
              <UInputNumber v-model="form.durationMin" :min="1" :step="5" placeholder="—" class="w-full" />
            </UFormField>
            <UFormField name="durationMax" data-field="durationMax" label="Партия до, мин">
              <UInputNumber v-model="form.durationMax" :min="1" :step="5" placeholder="—" class="w-full" />
            </UFormField>
          </div>

          <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <UFormField name="playerAge" data-field="playerAge" label="Возраст игроков">
              <EntityFormAgeInput v-model="form.playerAge" />
            </UFormField>
            <UFormField name="year" data-field="year" label="Год издания">
              <UInputNumber
                v-model="form.year"
                :min="1800"
                :max="2100"
                :format-options="{ useGrouping: false }"
                placeholder="—"
                class="w-full"
              />
            </UFormField>
          </div>
        </EntityFormCard>

        <EntityFormCard title="Материалы" icon="i-lucide-paperclip">
          <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <UFormField
              name="videoUrl"
              data-field="videoUrl"
              label="Видео с правилами"
              description="Ссылка на YouTube, Rutube, VK Видео"
            >
              <UInput
                v-model="form.videoUrl"
                placeholder="https://…"
                icon="i-lucide-play-circle"
                class="w-full"
              />
            </UFormField>
            <UFormField label="Файл с правилами" description="PDF">
              <UploadDocument v-model="form.rulesFileId" :preview="loaded?.rulesFile?.path" />
            </UFormField>
          </div>
        </EntityFormCard>

        <template #aside>
          <EntityFormCard title="Публикация" icon="i-lucide-send">
            <EntityFormPublishSwitch
              v-model="form.isDeleted"
              shown-text="Игра видна в каталоге"
              hidden-text="Игра скрыта от посетителей"
            />
          </EntityFormCard>

          <EntityFormCard title="Экземпляр в фонде" icon="i-lucide-archive">
            <UFormField name="status" data-field="status" label="Наличие" required>
              <USelect
                v-model="form.status"
                :items="GAME_STATUS_OPTIONS"
                label-key="label"
                value-key="value"
                class="w-full"
              />
            </UFormField>
            <UFormField name="place" label="Место хранения">
              <UInput v-model="form.place" placeholder="Например, стеллаж 3" class="w-full" />
            </UFormField>
            <UFormField name="comment" label="Комментарий">
              <UTextarea v-model="form.comment" autoresize :rows="2" class="w-full" />
            </UFormField>
          </EntityFormCard>

          <EntityFormCard title="Рубрикация" icon="i-lucide-folder-tree">
            <UFormField label="Жанры" description="Можно создать новый — введите название">
              <SelectGenre v-model="form.genreIds" />
            </UFormField>
            <UFormField label="Серия">
              <SelectSeries v-model="form.seriesId" />
            </UFormField>
          </EntityFormCard>

          <EntityFormChecklist :items="checklist" />
        </template>
      </EntityFormBody>
    </UForm>
  </div>
</template>
