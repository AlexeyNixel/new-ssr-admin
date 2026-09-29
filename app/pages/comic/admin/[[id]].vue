<script setup lang="ts">
import UploadImages from '~/components/Ui/UploadImages.vue';
import SelectComicGenre from '~/components/Ui/SelectComicGenre.vue';
import SelectComicSeries from '~/components/Ui/SelectComicSeries.vue';
import { useComicApi } from '~~/services/api/comic.api';
import type { Comic } from '~~/services/types/comic.type';
import { comicSchema } from '~/schemas/comic.schema';

const route = useRoute();
const comicId = route.params.id as string | undefined;
const isUpdate = !!comicId;

const toast = useToast();
const comicApi = useComicApi();

const form = reactive({
  title: '',
  description: '',
  author: '',
  illustrator: '',
  volumeNumber: null as number | null,
  year: null as number | null,
  ageRating: null as number | null,
  externalLink: '',
  isDeleted: false,
  seriesId: undefined as string | undefined,
  imageFileIds: [] as string[],
  genreIds: [] as string[],
});
const imagePreviews = ref<{ id: string; path: string }[]>([]);

const loaded = ref<Comic>();
const loadError = ref(false);

if (comicId) {
  try {
    const data = await comicApi.getOneComic(comicId);
    loaded.value = data;
    Object.assign(form, {
      title: data.title ?? '',
      description: data.description ?? '',
      author: data.author ?? '',
      illustrator: data.illustrator ?? '',
      volumeNumber: data.volumeNumber ?? null,
      year: data.year ?? null,
      ageRating: data.ageRating ?? null,
      externalLink: data.externalLink ?? '',
      isDeleted: !!data.isDeleted,
      seriesId: data.seriesId ?? undefined,
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
    volumeNumber: 'Номер тома',
    year: 'Год издания',
    ageRating: 'Возрастное ограничение',
    externalLink: 'Ссылка на источник',
  },
});

const status = computed(() =>
  publicationStatus(isUpdate, form.isDeleted, { shown: 'Опубликован', hidden: 'Скрыт', created: 'Новый' })
);

const descriptionLength = computed(() => form.description.trim().length);

const checklist = computed(() => [
  { label: 'Название', done: form.title.trim().length >= 2 },
  { label: 'Краткое описание', done: descriptionLength.value > 0 },
  { label: 'Обложка', done: form.imageFileIds.length > 0 },
  { label: 'Автор', done: !!(form.author.trim() || form.illustrator.trim()) },
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
    description: form.description.trim(),
    author: form.author.trim(),
    illustrator: form.illustrator.trim(),
    externalLink: form.externalLink.trim(),
    // очищенное числовое поле — undefined, а он выпадает из JSON: шлём null
    volumeNumber: form.volumeNumber ?? null,
    year: form.year ?? null,
    ageRating: form.ageRating ?? null,
  };

  try {
    if (isUpdate) {
      await comicApi.updateComic(comicId!, payload);
      toast.add({ title: 'Комикс обновлён', color: 'success', icon: 'i-lucide-circle-check' });
    } else {
      await comicApi.createComic(payload);
      toast.add({ title: 'Комикс создан', color: 'success', icon: 'i-lucide-circle-check' });
    }
    markSaved();
    await navigateTo('/comic');
  } catch {
    toast.add({
      title: 'Не удалось сохранить комикс',
      description: 'Проверьте соединение и попробуйте ещё раз',
      color: 'error',
    });
  } finally {
    saving.value = false;
  }
};

const focusDescription = () => document.getElementById('comic-description')?.focus();

useHead({ title: isUpdate ? 'НОМБ | Редактирование комикса' : 'НОМБ | Новый комикс' });
</script>

<template>
  <div class="min-h-screen bg-muted">
    <EntityFormNotFound
      v-if="loadError"
      title="Комикс не найден"
      back-to="/comic"
      back-label="К списку комиксов"
    />

    <UForm
      v-else
      ref="formRef"
      :schema="comicSchema"
      :state="form"
      @submit="onSubmit"
      @error="onError"
    >
      <EntityFormHeader
        back-to="/comic"
        back-label="К списку комиксов"
        section="Комиксы"
        :title="isUpdate ? form.title || 'Редактирование комикса' : 'Новый комикс'"
        :status="status"
        :is-dirty="isDirty"
        :saving="saving"
        :submit-label="isUpdate ? 'Сохранить' : 'Создать комикс'"
      />

      <EntityFormBody>
        <section class="space-y-5 rounded-xl border border-default bg-default p-4 shadow-xs sm:p-6">
          <EntityFormTitleInput
            v-model="form.title"
            placeholder="Название комикса"
            @enter="focusDescription"
          />

          <UFormField
            name="description"
            data-field="description"
            label="Краткое описание"
            description="Показывается в карточке комикса в каталоге"
          >
            <template #hint>
              <span class="tabular-nums text-muted">{{ descriptionLength }} симв.</span>
            </template>
            <UTextarea
              id="comic-description"
              v-model="form.description"
              placeholder="О чём комикс — в двух-трёх предложениях"
              autoresize
              :rows="4"
              :maxrows="12"
              class="w-full"
            />
          </UFormField>
        </section>

        <EntityFormCard title="Изображения" icon="i-lucide-images">
          <p class="-mt-2 text-xs text-muted">
            До трёх изображений, первое — обложка в каталоге
          </p>
          <UploadImages v-model="form.imageFileIds" :previews="imagePreviews" />
        </EntityFormCard>

        <EntityFormCard title="Сведения об издании" icon="i-lucide-book-open">
          <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <UFormField name="author" label="Сценарист">
              <UInput v-model="form.author" placeholder="Имя автора" class="w-full" />
            </UFormField>
            <UFormField name="illustrator" label="Художник">
              <UInput v-model="form.illustrator" placeholder="Имя художника" class="w-full" />
            </UFormField>
          </div>

          <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <UFormField label="Серия" description="Можно создать новую — введите название">
              <SelectComicSeries v-model="form.seriesId" />
            </UFormField>
            <UFormField
              name="volumeNumber"
              data-field="volumeNumber"
              label="Номер тома / выпуска"
              description="0 — нулевой том (приквел, пилот)"
            >
              <UInputNumber
                v-model="form.volumeNumber"
                :min="0"
                placeholder="—"
                class="w-full"
              />
            </UFormField>
          </div>

          <UFormField name="year" data-field="year" label="Год издания" class="sm:w-1/2 sm:pr-2">
            <UInputNumber
              v-model="form.year"
              :min="1800"
              :max="2100"
              :format-options="{ useGrouping: false }"
              placeholder="—"
              class="w-full"
            />
          </UFormField>
        </EntityFormCard>

        <template #aside>
          <EntityFormCard title="Публикация" icon="i-lucide-send">
            <EntityFormPublishSwitch
              v-model="form.isDeleted"
              shown-text="Комикс виден в каталоге"
              hidden-text="Комикс скрыт от посетителей"
            />
          </EntityFormCard>

          <EntityFormCard title="Рубрикация" icon="i-lucide-folder-tree">
            <UFormField label="Жанры" description="Можно создать новый — введите название">
              <SelectComicGenre v-model="form.genreIds" />
            </UFormField>

            <UFormField name="ageRating" data-field="ageRating" label="Возрастное ограничение">
              <EntityFormAgeInput v-model="form.ageRating" />
            </UFormField>
          </EntityFormCard>

          <EntityFormCard>
            <UFormField
              name="externalLink"
              data-field="externalLink"
              label="Ссылка на источник"
              description="Где прочитать или купить"
              :ui="{ label: 'font-semibold' }"
            >
              <UInput
                v-model="form.externalLink"
                placeholder="https://…"
                icon="i-lucide-link"
                class="w-full"
              />
            </UFormField>
          </EntityFormCard>

          <EntityFormChecklist :items="checklist" />
        </template>
      </EntityFormBody>
    </UForm>
  </div>
</template>
