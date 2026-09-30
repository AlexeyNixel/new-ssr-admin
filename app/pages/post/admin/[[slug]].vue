<script setup lang="ts">
import slugify from 'slugify';
import { CalendarDate } from '@internationalized/date';
import type { FormErrorEvent } from '@nuxt/ui';
import { usePostApi } from '~~/services/api/post.api';
import { useDepartmentApi } from '~~/services/api/department.api';
import type { Post, PostPayload } from '~~/services/types/post.type';
import type { Department } from '~~/services/types/department.type';
import { createPostSchema, htmlToText, POST_DESCRIPTION_MAX } from '~/schemas/post.schema';
import EditorCustom from '~/components/Editor/EditorCustom.vue';

// Параметр маршрута называется slug, но в него передаётся id новости
const route = useRoute();
const postId = route.params.slug as string | undefined;
const isUpdate = !!postId;

const toast = useToast();
const postApi = usePostApi();
const departmentApi = useDepartmentApi();

const SITE_URL = `${useRuntimeConfig().public.siteUrl}/entry/`;

const form = reactive({
  title: '',
  description: '',
  content: '',
  slug: '',
  tags: [] as string[],
  departmentId: undefined as string | undefined,
  isDeleted: false,
  isPinned: false,
  previewFileId: undefined as string | undefined,
});
const previewPath = ref('');
const publishedAt = ref(new Date());

const loaded = ref<Post>();
const loadError = ref(false);
const departments = ref<Department[]>([]);

const [departmentsRes, postRes] = await Promise.allSettled([
  departmentApi.getAllDepartments({ limit: 100 }),
  postId ? postApi.getPostById(postId) : Promise.resolve(undefined),
]);

if (departmentsRes.status === 'fulfilled') {
  departments.value = departmentsRes.value.data ?? [];
}

if (postId) {
  if (postRes.status === 'fulfilled' && postRes.value) {
    const data = postRes.value;
    loaded.value = data;
    Object.assign(form, {
      title: data.title ?? '',
      description: data.description ?? '',
      content: data.content ?? '',
      slug: data.slug ?? '',
      tags: (data.tags ?? []).map((tag) => tag.id),
      departmentId: data.departmentId ?? data.department?.id,
      isDeleted: !!data.isDeleted,
      isPinned: !!data.isPinned,
      previewFileId: data.previewFileId ?? data.preview?.id,
    });
    previewPath.value = data.preview?.path ?? '';
    if (data.publishedAt) publishedAt.value = new Date(data.publishedAt);
  } else {
    loadError.value = true;
  }
}

const schema = createPostSchema(loaded.value?.slug);

const formRef = useTemplateRef('formRef');

// UFileUpload сообщает форме об изменении ещё до окончания загрузки —
// перепроверяем обложку, когда id уже известен
watch(
  () => form.previewFileId,
  () => formRef.value?.validate({ name: 'previewFileId', silent: true })
);

// ---------- Несохранённые изменения ----------

const snapshot = () =>
  JSON.stringify({ ...form, previewPath: previewPath.value, publishedAt: publishedAt.value.getTime() });

const savedState = ref(snapshot());
const isDirty = computed(() => savedState.value !== snapshot());

onBeforeRouteLeave(() => {
  if (isDirty.value && !window.confirm('Есть несохранённые изменения. Уйти со страницы?')) {
    return false;
  }
});

useEventListener(window, 'beforeunload', (event: BeforeUnloadEvent) => {
  if (isDirty.value) event.preventDefault();
});

// ---------- Дата публикации ----------

// Календарь меняет только дату, время публикации сохраняется
const publishedDate = computed({
  get: () =>
    new CalendarDate(
      publishedAt.value.getFullYear(),
      publishedAt.value.getMonth() + 1,
      publishedAt.value.getDate()
    ),
  set: (value) => {
    if (!value) return;
    const next = new Date(publishedAt.value);
    next.setFullYear(value.year, value.month - 1, value.day);
    publishedAt.value = next;
  },
});

const datePopoverOpen = ref(false);
const setToday = () => {
  publishedAt.value = new Date();
  datePopoverOpen.value = false;
};

const dateFormatter = new Intl.DateTimeFormat('ru-RU', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});
const isFuture = computed(() => publishedAt.value.getTime() > Date.now() + 60_000);

// ---------- Статус ----------

const isPublished = computed({
  get: () => !form.isDeleted,
  set: (value: boolean) => {
    form.isDeleted = !value;
  },
});

const status = computed(() => {
  if (!isUpdate) return { label: 'Новая', color: 'neutral' as const };
  return form.isDeleted
    ? { label: 'Скрыта', color: 'warning' as const }
    : { label: 'Опубликована', color: 'success' as const };
});

const siteUrl = computed(() => (loaded.value?.slug ? SITE_URL + loaded.value.slug : ''));

// ---------- Адрес (slug) ----------

const generateSlug = () => {
  if (!form.title.trim()) {
    toast.add({ title: 'Сначала заполните заголовок', color: 'warning' });
    return;
  }
  // Тот же формат, что генерирует бэкенд: заголовок-ГГГГ-ММ-ДД
  const date = publishedDate.value.toString();
  form.slug = `${slugify(form.title, { lower: true, strict: true, locale: 'ru' })}-${date}`;
};

// ---------- Готовность ----------

const descriptionLength = computed(() => form.description.trim().length);

const checklist = computed(() => [
  { label: 'Заголовок', done: form.title.trim().length >= 8 },
  {
    label: 'Краткое описание',
    done: descriptionLength.value >= 16 && descriptionLength.value <= POST_DESCRIPTION_MAX,
  },
  { label: 'Текст новости', done: htmlToText(form.content).length > 0 || /<(img|iframe)\b/i.test(form.content) },
  { label: 'Обложка', done: !!form.previewFileId },
  { label: 'Отдел', done: !!form.departmentId },
]);
const readyCount = computed(() => checklist.value.filter((item) => item.done).length);

// ---------- Сохранение ----------

const saving = ref(false);

const onSubmit = async () => {
  if (saving.value) return;
  saving.value = true;

  const payload: PostPayload = {
    ...form,
    title: form.title.trim(),
    description: form.description.trim(),
    // пустой адрес не отправляем: бэкенд сформирует его сам (при создании)
    // или оставит прежний (при редактировании)
    slug: form.slug.trim() || undefined,
    publishedAt: publishedAt.value.toISOString(),
  };

  try {
    if (isUpdate) {
      await postApi.updatePost(postId!, payload);
      toast.add({ title: 'Новость обновлена', color: 'success', icon: 'i-lucide-circle-check' });
    } else {
      await postApi.createPost(payload);
      toast.add({ title: 'Новость создана', color: 'success', icon: 'i-lucide-circle-check' });
    }
    savedState.value = snapshot();
    await navigateTo('/post');
  } catch {
    toast.add({
      title: 'Не удалось сохранить новость',
      description: 'Проверьте соединение и попробуйте ещё раз',
      color: 'error',
    });
  } finally {
    saving.value = false;
  }
};

const FIELD_LABELS: Record<string, string> = {
  title: 'Заголовок',
  description: 'Краткое описание',
  content: 'Текст новости',
  slug: 'Адрес на сайте',
  departmentId: 'Отдел',
  previewFileId: 'Обложка',
};

const onError = (event: FormErrorEvent) => {
  const fields = [...new Set(event.errors.map((error) => FIELD_LABELS[error.name ?? ''] ?? error.name))];
  toast.add({
    title: 'Проверьте заполнение полей',
    description: fields.filter(Boolean).join(', '),
    color: 'error',
  });
  const name = event.errors[0]?.name;
  const field = name ? document.querySelector(`[data-field="${name}"]`) : null;
  field?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  const input = document.getElementById(event.errors[0]?.id ?? '');
  input?.focus({ preventScroll: true });
};

// Ctrl/⌘ + S — сохранить
useEventListener(window, 'keydown', (event: KeyboardEvent) => {
  if ((event.ctrlKey || event.metaKey) && event.code === 'KeyS') {
    event.preventDefault();
    formRef.value?.submit();
  }
});

const focusDescription = () => document.getElementById('post-description')?.focus();

useHead({ title: isUpdate ? 'НОМБ | Редактирование новости' : 'НОМБ | Новая новость' });
</script>

<template>
  <div class="min-h-screen bg-muted [--editor-toolbar-top:4rem]">
    <!-- Новость не загрузилась -->
    <div v-if="loadError" class="mx-auto flex max-w-md flex-col items-center gap-4 px-4 py-24 text-center">
      <div class="flex size-14 items-center justify-center rounded-full bg-error/10 text-error">
        <UIcon name="i-lucide-file-x" class="size-7" />
      </div>
      <div>
        <p class="text-lg font-semibold text-highlighted">Новость не найдена</p>
        <p class="mt-1 text-sm text-muted">Возможно, она была удалена или ссылка устарела.</p>
      </div>
      <UButton to="/post" icon="i-lucide-arrow-left" label="К списку новостей" color="neutral" variant="outline" />
    </div>

    <UForm
      v-else
      ref="formRef"
      :schema="schema"
      :state="form"
      @submit="onSubmit"
      @error="onError"
    >
      <!-- Шапка -->
      <header class="sticky top-0 z-30 h-16 border-b border-default bg-default/90 backdrop-blur">
        <div class="mx-auto flex h-full max-w-7xl items-center gap-2 px-4 sm:gap-3 sm:px-6">
          <UButton
            to="/post"
            icon="i-lucide-arrow-left"
            color="neutral"
            variant="ghost"
            aria-label="К списку новостей"
          />

          <div class="min-w-0 flex-1">
            <p class="hidden text-xs text-muted sm:block">Новости</p>
            <p class="truncate text-base font-semibold text-highlighted sm:text-lg">
              {{ isUpdate ? form.title || 'Редактирование новости' : 'Новая новость' }}
            </p>
          </div>

          <span
            v-if="isDirty"
            class="hidden items-center gap-1.5 text-xs text-warning md:flex"
          >
            <span class="size-1.5 rounded-full bg-warning" />
            Не сохранено
          </span>

          <UBadge
            :label="status.label"
            :color="status.color"
            variant="subtle"
            class="hidden sm:inline-flex"
          />

          <UTooltip v-if="siteUrl" text="Открыть на сайте">
            <UButton
              :to="siteUrl"
              target="_blank"
              icon="i-lucide-external-link"
              color="neutral"
              variant="outline"
              aria-label="Открыть на сайте"
            />
          </UTooltip>

          <UTooltip :kbds="['ctrl', 'S']" text="Сохранить">
            <UButton
              type="submit"
              icon="i-lucide-save"
              :loading="saving"
              color="primary"
            >
              <span class="hidden sm:inline">{{ isUpdate ? 'Сохранить' : 'Создать новость' }}</span>
            </UButton>
          </UTooltip>
        </div>
      </header>

      <div
        class="mx-auto grid max-w-7xl grid-cols-1 gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[minmax(0,1fr)_320px] xl:grid-cols-[minmax(0,1fr)_360px]"
      >
        <!-- Основное -->
        <main class="min-w-0 space-y-6">
          <section class="space-y-5 rounded-xl border border-default bg-default p-4 shadow-xs sm:p-6">
            <UFormField name="title" data-field="title" :ui="{ error: 'mt-1' }">
              <UTextarea
                v-model="form.title"
                placeholder="Заголовок новости"
                aria-label="Заголовок новости"
                variant="none"
                autoresize
                :rows="1"
                :maxrows="4"
                class="w-full"
                :ui="{ base: 'p-0 overflow-hidden text-2xl font-bold leading-tight text-highlighted sm:text-3xl placeholder:text-dimmed resize-none' }"
                @keydown.enter.prevent="focusDescription"
              />
            </UFormField>

            <UFormField
              name="description"
              data-field="description"
              label="Краткое описание"
              description="Показывается в списке новостей и в превью при публикации ссылки"
              required
            >
              <template #hint>
                <span
                  class="tabular-nums"
                  :class="descriptionLength > POST_DESCRIPTION_MAX ? 'text-error' : 'text-muted'"
                >
                  {{ descriptionLength }} / {{ POST_DESCRIPTION_MAX }}
                </span>
              </template>
              <UTextarea
                id="post-description"
                v-model="form.description"
                placeholder="О чём новость — в двух-трёх предложениях"
                autoresize
                :rows="3"
                :maxrows="10"
                class="w-full"
              />
            </UFormField>
          </section>

          <UFormField
            name="content"
            data-field="content"
            label="Текст новости"
            required
            :ui="{ label: 'text-base font-semibold', container: 'mt-2' }"
          >
            <EditorCustom v-model="form.content" />
          </UFormField>
        </main>

        <!-- Параметры -->
        <aside class="min-w-0 space-y-4">
          <!-- Публикация -->
          <section class="space-y-4 rounded-xl border border-default bg-default p-4 shadow-xs">
            <div class="flex items-center gap-2 text-sm font-semibold text-highlighted">
              <UIcon name="i-lucide-send" class="size-4 text-muted" />
              Публикация
            </div>

            <USwitch
              v-model="isPublished"
              label="Показывать на сайте"
              :description="isPublished ? 'Новость видна посетителям' : 'Новость скрыта от посетителей'"
            />
            <USwitch
              v-model="form.isPinned"
              label="Закрепить"
              description="Новость будет выше остальных в ленте"
            />

            <UFormField label="Дата публикации" :help="isFuture ? 'Дата в будущем' : undefined">
              <UPopover v-model:open="datePopoverOpen">
                <UButton
                  color="neutral"
                  variant="outline"
                  icon="i-lucide-calendar"
                  trailing-icon="i-lucide-chevron-down"
                  class="w-full"
                  :ui="{ trailingIcon: 'ms-auto text-dimmed' }"
                >
                  {{ dateFormatter.format(publishedAt) }}
                </UButton>

                <template #content>
                  <div class="p-2">
                    <UCalendar v-model="publishedDate" />
                    <UButton
                      label="Сегодня"
                      color="neutral"
                      variant="soft"
                      size="sm"
                      block
                      class="mt-2"
                      @click="setToday"
                    />
                  </div>
                </template>
              </UPopover>
            </UFormField>
          </section>

          <!-- Обложка -->
          <section class="space-y-3 rounded-xl border border-default bg-default p-4 shadow-xs">
            <UFormField
              name="previewFileId"
              data-field="previewFileId"
              label="Обложка"
              required
              :ui="{ label: 'font-semibold' }"
            >
              <template #default="{ error }">
                <PostCover
                  v-model="form.previewFileId"
                  v-model:path="previewPath"
                  :invalid="!!error"
                />
              </template>
            </UFormField>
          </section>

          <!-- Рубрикация -->
          <section class="space-y-4 rounded-xl border border-default bg-default p-4 shadow-xs">
            <div class="flex items-center gap-2 text-sm font-semibold text-highlighted">
              <UIcon name="i-lucide-folder-tree" class="size-4 text-muted" />
              Рубрикация
            </div>

            <UFormField name="departmentId" data-field="departmentId" label="Отдел" required>
              <USelectMenu
                v-model="form.departmentId"
                :items="departments"
                label-key="title"
                value-key="id"
                placeholder="Выберите отдел"
                :search-input="{ placeholder: 'Поиск отдела…' }"
                class="w-full"
              />
            </UFormField>

            <UFormField label="Теги" description="Можно создать новый тег — просто введите его название">
              <UiSelectTag v-model="form.tags" />
            </UFormField>
          </section>

          <!-- Адрес -->
          <section class="space-y-3 rounded-xl border border-default bg-default p-4 shadow-xs">
            <UFormField
              name="slug"
              data-field="slug"
              label="Адрес на сайте"
              :description="
                isUpdate
                  ? 'Если изменить адрес, старые ссылки на новость перестанут работать'
                  : 'Можно оставить пустым — адрес сформируется из заголовка и даты'
              "
              :ui="{ label: 'font-semibold' }"
            >
              <UInput
                v-model="form.slug"
                placeholder="сформируется автоматически"
                class="w-full"
                :ui="{ base: 'ps-14', leading: 'pointer-events-none' }"
              >
                <template #leading>
                  <span class="text-sm text-dimmed">/entry/</span>
                </template>
              </UInput>
            </UFormField>
            <UButton
              icon="i-lucide-wand-sparkles"
              label="Сформировать из заголовка"
              color="neutral"
              variant="soft"
              size="sm"
              block
              @click="generateSlug"
            />
          </section>

          <!-- Готовность -->
          <section class="space-y-3 rounded-xl border border-default bg-default p-4 shadow-xs">
            <div class="flex items-center justify-between text-sm font-semibold text-highlighted">
              <span class="flex items-center gap-2">
                <UIcon name="i-lucide-list-checks" class="size-4 text-muted" />
                Готовность
              </span>
              <span class="tabular-nums text-muted">{{ readyCount }} / {{ checklist.length }}</span>
            </div>
            <UProgress :model-value="readyCount" :max="checklist.length" size="sm" :color="readyCount === checklist.length ? 'success' : 'primary'" />
            <ul class="space-y-1.5 text-sm">
              <li v-for="item in checklist" :key="item.label" class="flex items-center gap-2">
                <UIcon
                  :name="item.done ? 'i-lucide-circle-check' : 'i-lucide-circle'"
                  class="size-4 shrink-0"
                  :class="item.done ? 'text-success' : 'text-dimmed'"
                />
                <span :class="item.done ? 'text-default' : 'text-muted'">{{ item.label }}</span>
              </li>
            </ul>
            <p class="hidden text-xs text-dimmed lg:block">
              Сохранить можно клавишами <UKbd value="ctrl" size="sm" /> + <UKbd value="S" size="sm" />
            </p>
          </section>
        </aside>
      </div>
    </UForm>
  </div>
</template>
