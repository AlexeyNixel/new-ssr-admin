<script setup lang="ts">
import type { FormErrorEvent } from '@nuxt/ui';
import UploadImage from '~/components/Ui/UploadImage.vue';
import SelectCollection from '~/components/Ui/SelectCollection.vue';
import EditorCustom from '~/components/Editor/EditorCustom.vue';
import { useBookApi } from '~~/services/api/book.api';
import type { Book, BookPayload } from '~~/services/types/book.type';
import { bookSchema } from '~/schemas/book.schema';
import { htmlToText } from '~/schemas/post.schema';
import { BOOK_PLACES } from '~/constants/bookPlaces';

const route = useRoute();
const bookId = route.params.id as string | undefined;
const isUpdate = !!bookId;

const toast = useToast();
const bookApi = useBookApi();
const config = useRuntimeConfig();

const form = reactive({
  title: '',
  description: '',
  content: '',
  previewFileId: '',
  place: 'НОМБ',
  litresLink: '',
  isDeleted: false,
  isVideo: false,
  collections: [] as string[],
});

const loaded = ref<Book>();
const loadError = ref(false);

if (bookId) {
  try {
    // GET /:id отдаёт и подборки книги — их бэкенд заменяет списком из формы
    const data = await bookApi.getOneBook(bookId);
    loaded.value = data;
    Object.assign(form, {
      title: data.title ?? '',
      description: data.description ?? '',
      content: data.content ?? '',
      previewFileId: data.previewFileId ?? '',
      place: data.place ?? '',
      litresLink: data.litresLink ?? '',
      isDeleted: !!data.isDeleted,
      isVideo: !!data.isVideo,
      collections: (data.collections ?? []).map((collection) => collection.id),
    });
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
    description: 'Библиографическая запись',
    previewFileId: 'Обложка',
    place: 'Где взять',
    litresLink: 'Ссылка на ЛитРес',
  },
});

const status = computed(() =>
  publicationStatus(isUpdate, form.isDeleted, { shown: 'Опубликована', hidden: 'Скрыта', created: 'Новая' })
);

const siteLink = computed(() => {
  const slug = loaded.value?.slug;
  return isUpdate && slug && !form.isDeleted ? `${config.public.siteUrl}/books/${slug}` : undefined;
});

// ---------- Библиографическая запись ----------

// То же, что сайт достанет из записи для карточки и страницы книги
const record = computed(() => parseBookRecord(form.description));

const recordFields = computed(() =>
  [
    { label: 'Автор', value: record.value.author },
    { label: 'Пометка', value: record.value.note },
    { label: 'Перевод', value: record.value.translation },
    { label: 'Издательство', value: [record.value.publisher, record.value.city].filter(Boolean).join(', ') },
    { label: 'Год', value: record.value.year },
    { label: 'Страниц', value: record.value.pages },
    { label: 'Серия', value: record.value.series },
    { label: 'ISBN', value: record.value.isbn },
  ].filter((row): row is { label: string; value: string } => !!row.value)
);

const suggestedTitle = computed(() => {
  const title = record.value.title;
  return title && title !== form.title.trim() ? title : undefined;
});

// ---------- Где взять ----------

const customPlaces = ref<string[]>([]);
const placeItems = computed(() => {
  const items = [...BOOK_PLACES, ...customPlaces.value];
  return form.place && !items.includes(form.place) ? [form.place, ...items] : items;
});
const onCreatePlace = (value: string) => {
  const place = value.trim();
  if (!place) return;
  customPlaces.value.push(place);
  form.place = place;
};

const TYPE_ITEMS = [
  { label: 'Книга', description: 'Обычная карточка книги', value: false },
  { label: 'Видеообзор', description: 'Отметка «Есть видеообзор», видео — в аннотации', value: true },
];

const checklist = computed(() => [
  { label: 'Название', done: form.title.trim().length >= 2 },
  { label: 'Обложка', done: !!form.previewFileId },
  { label: 'Библиографическая запись распознана', done: record.value.isRecord },
  { label: 'Аннотация', done: htmlToText(form.content).length > 0 },
  { label: 'Где взять', done: form.place.trim().length > 0 },
  { label: 'Подборки', done: form.collections.length > 0 },
]);

// ---------- Сохранение ----------

const saving = ref(false);
// «Создать и добавить ещё»: после сохранения форма очищается, а место,
// тип и подборки остаются — книги обычно заводят пачкой из одного отдела
const addAnother = ref(false);
const formKey = ref(0);

const submitAndAddAnother = () => {
  addAnother.value = true;
  formRef.value?.submit();
};

const onValidationError = (event: FormErrorEvent) => {
  addAnother.value = false;
  onError(event);
};

const resetForNext = async () => {
  Object.assign(form, { title: '', description: '', content: '', previewFileId: '', isDeleted: false });
  formKey.value++; // пересоздаём загрузчик обложки и редактор
  markSaved();
  window.scrollTo({ top: 0, behavior: 'smooth' });
  await nextTick();
  document.querySelector<HTMLTextAreaElement>('[data-field="title"] textarea')?.focus({ preventScroll: true });
};

const onSubmit = async () => {
  const again = addAnother.value;
  addAnother.value = false;
  if (saving.value) return;
  saving.value = true;

  const payload: BookPayload = {
    title: form.title.trim(),
    description: form.description.trim(),
    content: form.content,
    previewFileId: form.previewFileId,
    place: form.place.trim(),
    // необязательная ссылка: пустую строку храним как отсутствие ссылки
    litresLink: form.litresLink.trim() || null,
    isDeleted: form.isDeleted,
    isVideo: form.isVideo,
    collections: form.collections,
  };

  try {
    if (isUpdate) {
      await bookApi.updateBook(bookId!, payload);
      toast.add({ title: 'Книга обновлена', color: 'success', icon: 'i-lucide-circle-check' });
    } else {
      await bookApi.createBook(payload);
      toast.add({
        title: 'Книга создана',
        description: again ? 'Можно заполнять следующую' : undefined,
        color: 'success',
        icon: 'i-lucide-circle-check',
      });
    }

    if (again) {
      await resetForNext();
      return;
    }
    markSaved();
    await navigateTo('/book');
  } catch {
    toast.add({
      title: 'Не удалось сохранить книгу',
      description: 'Проверьте соединение и попробуйте ещё раз',
      color: 'error',
    });
  } finally {
    saving.value = false;
  }
};

const focusDescription = () => document.getElementById('book-description')?.focus();

useHead({ title: isUpdate ? 'НОМБ | Редактирование книги' : 'НОМБ | Новая книга' });
</script>

<template>
  <div class="min-h-screen bg-muted [--editor-toolbar-top:4rem]">
    <EntityFormNotFound
      v-if="loadError"
      title="Книга не найдена"
      back-to="/book"
      back-label="К списку книг"
    />

    <UForm
      v-else
      ref="formRef"
      :schema="bookSchema"
      :state="form"
      @submit="onSubmit"
      @error="onValidationError"
    >
      <EntityFormHeader
        back-to="/book"
        back-label="К списку книг"
        section="Книги"
        :title="isUpdate ? form.title || 'Редактирование книги' : 'Новая книга'"
        :status="status"
        :is-dirty="isDirty"
        :saving="saving"
        :site-url="siteLink"
        :submit-label="isUpdate ? 'Сохранить' : 'Создать книгу'"
      >
        <template v-if="!isUpdate" #actions>
          <UButton
            icon="i-lucide-copy-plus"
            color="neutral"
            variant="outline"
            :disabled="saving"
            class="hidden md:inline-flex"
            @click="submitAndAddAnother"
          >
            Создать и добавить ещё
          </UButton>
        </template>
      </EntityFormHeader>

      <EntityFormBody :key="formKey">
        <section class="space-y-5 rounded-xl border border-default bg-default p-4 shadow-xs sm:p-6">
          <EntityFormTitleInput
            v-model="form.title"
            placeholder="Название книги"
            @enter="focusDescription"
          />

          <UFormField
            name="description"
            data-field="description"
            label="Библиографическая запись"
            description="Вставьте запись из каталога — сайт возьмёт из неё автора, издательство, год и ISBN. Её же посетители копируют для списка литературы."
            required
          >
            <UTextarea
              id="book-description"
              v-model="form.description"
              placeholder="Шендеров, Герман Михайлович. Из бездны : [авторский сборник] / Г. М. Шендеров. – Москва : АСТ, 2024. – 512 с. – (Самая страшная книга). – ISBN 978-5-17-162700-3."
              autoresize
              :rows="3"
              :maxrows="10"
              class="w-full"
            />
          </UFormField>

          <div
            v-if="form.description.trim()"
            class="rounded-lg border border-default bg-elevated/50 p-3 text-sm"
          >
            <template v-if="record.isRecord">
              <p class="mb-2 flex items-center gap-1.5 text-xs font-medium text-success">
                <UIcon name="i-lucide-scan-text" class="size-4" />
                Сайт распознает в записи
              </p>
              <dl class="grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-1">
                <template v-for="field in recordFields" :key="field.label">
                  <dt class="text-muted">{{ field.label }}</dt>
                  <dd class="text-default">{{ field.value }}</dd>
                </template>
              </dl>
              <p v-if="!record.author" class="mt-2 text-xs text-warning">
                Автор не распознан — на карточке книги его не будет.
              </p>
            </template>
            <p v-else class="flex items-start gap-1.5 text-xs text-warning">
              <UIcon name="i-lucide-triangle-alert" class="mt-px size-4 shrink-0" />
              Не похоже на библиографическую запись (нет года, страниц или ISBN) — на сайте текст
              покажется как есть, без автора и выходных данных.
            </p>

            <UButton
              v-if="suggestedTitle"
              icon="i-lucide-wand-sparkles"
              color="neutral"
              variant="soft"
              size="sm"
              class="mt-3"
              @click="form.title = suggestedTitle"
            >
              {{ form.title.trim() ? 'Заменить' : 'Взять' }} название из записи: «{{ suggestedTitle }}»
            </UButton>
          </div>
        </section>

        <UFormField
          name="content"
          data-field="content"
          label="Аннотация"
          description="О чём книга и кому она понравится. Для видеообзора — вставьте сюда видео."
          :ui="{ label: 'text-base font-semibold', container: 'mt-2' }"
        >
          <EditorCustom v-model="form.content" />
        </UFormField>

        <template #aside>
          <EntityFormCard title="Публикация" icon="i-lucide-send">
            <EntityFormPublishSwitch
              v-model="form.isDeleted"
              shown-text="Книга видна в каталоге"
              hidden-text="Книга скрыта от посетителей"
            />
          </EntityFormCard>

          <EntityFormCard title="Обложка" icon="i-lucide-image">
            <UFormField name="previewFileId" data-field="previewFileId" required>
              <UploadImage
                v-model="form.previewFileId"
                :preview="loaded?.preview?.path"
                class="w-full"
              />
            </UFormField>
            <p class="text-xs text-muted">
              Вертикальная, 2:3 — например, 600×900. JPG, PNG или WebP.
            </p>
          </EntityFormCard>

          <EntityFormCard title="Тип" icon="i-lucide-shapes">
            <URadioGroup
              v-model="form.isVideo"
              :items="TYPE_ITEMS"
              value-key="value"
              variant="card"
              indicator="hidden"
              class="w-full"
              :ui="{ fieldset: 'grid gap-2', item: 'py-2.5', wrapper: 'text-left', description: 'text-left' }"
            />
          </EntityFormCard>

          <EntityFormCard title="Где взять" icon="i-lucide-map-pin">
            <UFormField
              name="place"
              data-field="place"
              label="Отдел"
              help="«НОМБ» — на сайте покажется название всей библиотеки"
              required
            >
              <USelectMenu
                v-model="form.place"
                :items="placeItems"
                create-item
                placeholder="Выберите или введите отдел"
                class="w-full"
                @create="onCreatePlace"
              />
            </UFormField>

            <UFormField
              name="litresLink"
              data-field="litresLink"
              label="Электронная версия на ЛитРес"
              help="Необязательно"
            >
              <UInput
                v-model="form.litresLink"
                placeholder="https://www.litres.ru/…"
                icon="i-lucide-tablet-smartphone"
                class="w-full"
              />
            </UFormField>
          </EntityFormCard>

          <EntityFormCard title="Подборки" icon="i-lucide-library">
            <UFormField
              description="Книга добавится в конец выбранных подборок. Новую подборку можно создать — введите название."
            >
              <SelectCollection v-model="form.collections" />
            </UFormField>
            <UButton
              to="/collection"
              target="_blank"
              color="neutral"
              variant="link"
              size="xs"
              trailing-icon="i-lucide-external-link"
              class="px-0"
            >
              Порядок книг — в редакторе подборки
            </UButton>
          </EntityFormCard>

          <EntityFormChecklist :items="checklist" />
        </template>
      </EntityFormBody>
    </UForm>
  </div>
</template>
