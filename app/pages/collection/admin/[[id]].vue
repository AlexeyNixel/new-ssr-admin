<script setup lang="ts">
import { z } from 'zod';
import { useBookApi } from '~~/services/api/book.api';
import type { Book, BookCollection } from '~~/services/types/book.type';
import UploadImage from '~/components/Ui/UploadImage.vue';

/** Сколько книг нужно, чтобы подборка смотрелась на сайте полноценно */
const MIN_BOOKS = 3;
const DESCRIPTION_MAX = 300;

const route = useRoute();
const collectionId = route.params.id as string | undefined;
const isUpdate = !!collectionId;

const toast = useToast();
const bookApi = useBookApi();
const config = useRuntimeConfig();

const form = reactive({
  label: '',
  description: '',
  slug: '',
  previewFileId: '',
  isDeleted: false,
});
const books = ref<Book[]>([]);

const loaded = ref<BookCollection>();
const loadError = ref(false);

if (collectionId) {
  try {
    const data = await bookApi.getOneCollection(collectionId);
    loaded.value = data;
    Object.assign(form, {
      label: data.label ?? '',
      description: data.description ?? '',
      // Временный адрес после миграции (= id) не показываем — бэкенд заменит его на адрес из названия
      slug: data.slug && data.slug !== data.id ? data.slug : '',
      previewFileId: data.previewFileId ?? '',
      isDeleted: !!data.isDeleted,
    });
    books.value = data.books ?? [];
  } catch {
    loadError.value = true;
  }
}

// ---------- Каталог книг для добавления ----------

const catalog = ref<Book[]>([]);
const catalogLoading = ref(true);

onMounted(async () => {
  try {
    const res = await bookApi.getAllBook({ include: 'preview', isDeleted: true, limit: 1000 });
    // Сначала книги, которые видны на сайте, — скрытые в подборке бесполезны
    catalog.value = [...(res.data ?? [])].sort((a, b) => Number(a.isDeleted) - Number(b.isDeleted));
  } catch {
    toast.add({ title: 'Не удалось загрузить каталог книг', color: 'error' });
  } finally {
    catalogLoading.value = false;
  }
});

const bookIds = computed(() => books.value.map((book) => book.id));

const toggleBook = (book: Book) => {
  books.value = bookIds.value.includes(book.id)
    ? books.value.filter((item) => item.id !== book.id)
    : [...books.value, book];
};

// ---------- Форма ----------

const schema = z.object({
  label: z.string().trim().min(1, 'Назовите подборку'),
  description: z.string().max(DESCRIPTION_MAX, `Не длиннее ${DESCRIPTION_MAX} символов`),
  slug: z
    .string()
    .trim()
    .regex(/^[a-z0-9-]*$/, 'Только латиница в нижнем регистре, цифры и дефис'),
});

const formRef = useTemplateRef('formRef');

const { isDirty, markSaved, onError } = useEntityForm({
  snapshot: () => ({ ...form, books: bookIds.value }),
  submit: () => formRef.value?.submit(),
  fieldLabels: {
    label: 'Название',
    description: 'Описание',
    slug: 'Адрес страницы',
  },
});

const status = computed(() =>
  publicationStatus(isUpdate, form.isDeleted, { shown: 'Опубликована', hidden: 'Скрыта', created: 'Новая' })
);

const visibleBooks = computed(() => books.value.filter((book) => !book.isDeleted));

const checklist = computed(() => [
  { label: 'Название', done: form.label.trim().length > 0 },
  { label: 'Описание: о чём подборка и кому она', done: form.description.trim().length >= 20 },
  {
    label: `Хотя бы ${MIN_BOOKS} ${plural(MIN_BOOKS, ['книга', 'книги', 'книг'])} на сайте`,
    done: visibleBooks.value.length >= MIN_BOOKS,
  },
]);

const siteLink = computed(() => {
  const slug = loaded.value?.slug;
  return isUpdate && slug && !form.isDeleted ? `${config.public.siteUrl}/books/collections/${slug}` : undefined;
});

// ---------- Сохранение ----------

const saving = ref(false);

const onSubmit = async () => {
  if (saving.value) return;
  saving.value = true;

  const payload = {
    label: form.label.trim(),
    description: form.description.trim() || null,
    slug: form.slug.trim() || undefined,
    previewFileId: form.previewFileId || null,
    isDeleted: form.isDeleted,
  };

  try {
    let id = collectionId;
    if (id) {
      await bookApi.updateCollection(id, payload);
    } else {
      const created = (await bookApi.createCollection(payload)) as BookCollection;
      id = created.id;
    }

    const saved = (await bookApi.setCollectionBooks(id, bookIds.value)) as BookCollection;
    markSaved();
    toast.add({
      title: isUpdate ? 'Подборка сохранена' : 'Подборка создана',
      color: 'success',
      icon: 'i-lucide-circle-check',
    });

    if (isUpdate) {
      loaded.value = saved;
      form.slug = saved.slug;
    } else {
      await navigateTo(`/collection/admin/${id}`, { replace: true });
    }
  } catch {
    toast.add({
      title: 'Не удалось сохранить подборку',
      description: 'Проверьте соединение и попробуйте ещё раз',
      color: 'error',
    });
  } finally {
    saving.value = false;
  }
};

useHead({ title: isUpdate ? 'НОМБ | Редактирование подборки' : 'НОМБ | Новая подборка' });
</script>

<template>
  <div class="min-h-screen bg-muted">
    <EntityFormNotFound
      v-if="loadError"
      title="Подборка не найдена"
      back-to="/collection"
      back-label="К подборкам"
    />

    <UForm
      v-else
      ref="formRef"
      :schema="schema"
      :state="form"
      @submit="onSubmit"
      @error="onError"
    >
      <EntityFormHeader
        back-to="/collection"
        back-label="К подборкам"
        section="Подборки книг"
        :title="isUpdate ? form.label || 'Редактирование подборки' : 'Новая подборка'"
        :status="status"
        :is-dirty="isDirty"
        :saving="saving"
        :submit-label="isUpdate ? 'Сохранить' : 'Создать подборку'"
      />

      <EntityFormBody>
        <section class="space-y-4 rounded-xl border border-default bg-default p-4 shadow-xs sm:p-6">
          <EntityFormTitleInput v-model="form.label" placeholder="Название подборки" />

          <UFormField
            name="description"
            data-field="description"
            label="О чём подборка"
            :help="`Пара предложений: тема и кому понравится. Видно на карточке и странице подборки. ${form.description.length}/${DESCRIPTION_MAX}`"
          >
            <UTextarea
              v-model="form.description"
              :rows="3"
              autoresize
              :maxlength="DESCRIPTION_MAX"
              placeholder="Например: книги, после которых хочется собрать рюкзак и поехать по Сибири"
              class="w-full"
            />
          </UFormField>
        </section>

        <section class="rounded-xl border border-default bg-default p-4 shadow-xs sm:p-6">
          <div class="mb-3 flex items-baseline justify-between gap-3">
            <h2 class="text-base! font-semibold text-highlighted">
              Книги в подборке
              <span class="font-normal text-muted">{{ books.length }}</span>
            </h2>
            <p class="flex items-center gap-1 text-xs text-muted">
              Порядок как на сайте: тяните за
              <UIcon name="i-lucide-grip-vertical" class="size-3.5" />
              или стрелками
            </p>
          </div>
          <CollectionBookList v-model="books" />
        </section>

        <section class="rounded-xl border border-default bg-default p-4 shadow-xs sm:p-6">
          <h2 class="mb-1 text-base! font-semibold text-highlighted">
            Добавить книги
          </h2>
          <p class="mb-4 text-sm text-muted">
            Нажмите на обложку — книга встанет в конец подборки. Повторное нажатие уберёт её.
          </p>
          <CollectionBookPicker
            :books="catalog"
            :selected-ids="bookIds"
            :loading="catalogLoading"
            @toggle="toggleBook"
          />
        </section>

        <template #aside>
          <EntityFormCard title="Публикация" icon="i-lucide-send">
            <EntityFormPublishSwitch
              v-model="form.isDeleted"
              shown-text="Подборка видна на сайте"
              hidden-text="Подборка скрыта от посетителей"
            />
            <UButton
              v-if="siteLink"
              :to="siteLink"
              target="_blank"
              color="neutral"
              variant="outline"
              icon="i-lucide-external-link"
              label="Открыть на сайте"
              block
            />
          </EntityFormCard>

          <EntityFormCard title="Карточка на сайте" icon="i-lucide-eye">
            <div class="rounded-lg bg-elevated px-4 pb-4 pt-5">
              <CollectionCoverFan :covers="visibleBooks" :height="110" />
              <p class="mt-3 line-clamp-2 font-semibold text-highlighted">
                {{ form.label || 'Название подборки' }}
              </p>
              <p class="text-sm text-muted">
                {{ visibleBooks.length }} {{ plural(visibleBooks.length, ['книга', 'книги', 'книг']) }}
              </p>
            </div>
            <p class="text-xs text-muted">
              На карточке — обложки первых четырёх книг. Самые яркие обложки ставьте в начало.
            </p>
          </EntityFormCard>

          <EntityFormCard title="Адрес страницы" icon="i-lucide-link">
            <UFormField
              name="slug"
              data-field="slug"
              help="Оставьте пустым — адрес соберётся из названия"
            >
              <UInput
                v-model="form.slug"
                placeholder="sovetuem-pochitat"
                class="w-full"
                :ui="{ base: 'ps-[8.75rem]' }"
              >
                <template #leading>
                  <span class="text-xs text-muted">/books/collections/</span>
                </template>
              </UInput>
            </UFormField>
          </EntityFormCard>

          <EntityFormCard title="Картинка для соцсетей" icon="i-lucide-image">
            <UploadImage
              v-model="form.previewFileId"
              :preview="loaded?.preview?.path"
              class="w-full"
            />
            <p class="text-xs text-muted">
              Необязательно. Показывается в превью ссылки в VK и Telegram, 1200×630.
            </p>
          </EntityFormCard>

          <EntityFormChecklist :items="checklist" />
        </template>
      </EntityFormBody>
    </UForm>
  </div>
</template>
