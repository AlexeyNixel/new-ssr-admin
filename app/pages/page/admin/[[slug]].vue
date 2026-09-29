<script setup lang="ts">
import slugify from 'slugify';
import type { Page, PageBlock } from '~~/services/types/page.type';
import { usePageApi } from '~~/services/api/page.api';
import { pageSchema } from '~/schemas/page.schema';
import { htmlToText } from '~/schemas/post.schema';
import EditorCustom from '~/components/Editor/EditorCustom.vue';

// Страница ищется бэкендом по slug
const route = useRoute();
const slug = route.params.slug as string | undefined;
const isUpdate = !!slug;

const pageApi = usePageApi();
const toast = useToast();

const form = reactive({
  title: '',
  slug: '',
  content: '',
  isDeleted: false,
  blocks: [] as PageBlock[],
});

const loaded = ref<Page>();
const loadError = ref(false);

if (slug) {
  try {
    const { data } = await pageApi.getOnePage(slug);
    if (!data?.id) throw new Error('not found');
    loaded.value = data;
    Object.assign(form, {
      title: data.title ?? '',
      slug: data.slug ?? '',
      content: data.content ?? '',
      isDeleted: !!data.isDeleted,
      blocks: data.blocks ?? [],
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
    slug: 'Адрес на сайте',
    content: 'Текст страницы',
  },
});

const status = computed(() =>
  publicationStatus(isUpdate, form.isDeleted, { shown: 'Опубликована', hidden: 'Скрыта', created: 'Новая' })
);

// ---------- Содержимое ----------

const hasText = computed(() => htmlToText(form.content).length > 0 || /<(img|iframe)\b/i.test(form.content));

const tabItems = computed(() => [
  {
    label: 'Конструктор блоков',
    icon: 'i-lucide-layout-grid',
    value: 'blocks',
    badge: form.blocks.length ? String(form.blocks.length) : undefined,
    slot: 'blocks' as const,
  },
  {
    label: 'Текст',
    icon: 'i-lucide-file-text',
    value: 'text',
    slot: 'text' as const,
  },
]);
// Открываем ту вкладку, которая реально используется на странице
const activeTab = ref(form.blocks.length || !hasText.value ? 'blocks' : 'text');

// ---------- Адрес (slug) ----------

const generateSlug = () => {
  if (!form.title.trim()) {
    toast.add({ title: 'Сначала заполните название', color: 'warning' });
    return;
  }
  form.slug = slugify(form.title, { lower: true, strict: true, locale: 'ru' });
};

const slugChanged = computed(() => isUpdate && form.slug !== (loaded.value?.slug ?? ''));

const checklist = computed(() => [
  { label: 'Название', done: form.title.trim().length > 0 },
  { label: 'Адрес на сайте', done: form.slug.trim().length > 0 },
  { label: 'Содержимое (блоки или текст)', done: form.blocks.length > 0 || hasText.value },
]);

// ---------- Сохранение ----------

const saving = ref(false);

const onSubmit = async () => {
  if (saving.value) return;
  saving.value = true;

  const payload = {
    ...form,
    title: form.title.trim(),
    slug: form.slug.trim(),
  };

  try {
    if (loaded.value) {
      await pageApi.update(loaded.value.id, payload);
      toast.add({ title: 'Страница обновлена', color: 'success', icon: 'i-lucide-circle-check' });
    } else {
      await pageApi.create(payload);
      toast.add({ title: 'Страница создана', color: 'success', icon: 'i-lucide-circle-check' });
    }
    markSaved();
    await navigateTo('/page');
  } catch {
    toast.add({
      title: 'Не удалось сохранить страницу',
      description: 'Проверьте соединение и попробуйте ещё раз',
      color: 'error',
    });
  } finally {
    saving.value = false;
  }
};

useHead({ title: isUpdate ? 'НОМБ | Редактирование страницы' : 'НОМБ | Новая страница' });
</script>

<template>
  <div class="min-h-screen bg-muted [--editor-toolbar-top:4rem]">
    <EntityFormNotFound
      v-if="loadError"
      title="Страница не найдена"
      back-to="/page"
      back-label="К списку страниц"
    />

    <UForm
      v-else
      ref="formRef"
      :schema="pageSchema"
      :state="form"
      @submit="onSubmit"
      @error="onError"
    >
      <EntityFormHeader
        back-to="/page"
        back-label="К списку страниц"
        section="Страницы"
        :title="isUpdate ? form.title || 'Редактирование страницы' : 'Новая страница'"
        :status="status"
        :is-dirty="isDirty"
        :saving="saving"
        :submit-label="isUpdate ? 'Сохранить' : 'Создать страницу'"
      />

      <EntityFormBody>
        <section class="rounded-xl border border-default bg-default p-4 shadow-xs sm:p-6">
          <EntityFormTitleInput v-model="form.title" placeholder="Название страницы" />
        </section>

        <UTabs
          v-model="activeTab"
          :items="tabItems"
          variant="link"
          class="w-full"
          :ui="{ list: 'mb-4', trigger: 'text-base' }"
        >
          <template #blocks>
            <EntityFormCard>
              <p class="text-sm text-muted">
                Страница собирается из блоков сверху вниз. Если блоков нет, на сайте показывается
                текст со вкладки «Текст».
              </p>
              <PageBuilder v-model="form.blocks" />
            </EntityFormCard>
          </template>

          <template #text>
            <UFormField
              name="content"
              data-field="content"
              description="Используется, если в конструкторе нет ни одного блока"
            >
              <EditorCustom v-model="form.content" />
            </UFormField>
          </template>
        </UTabs>

        <template #aside>
          <EntityFormCard title="Публикация" icon="i-lucide-send">
            <EntityFormPublishSwitch
              v-model="form.isDeleted"
              shown-text="Страница доступна посетителям"
              hidden-text="Страница скрыта от посетителей"
            />
          </EntityFormCard>

          <EntityFormCard class="space-y-3!">
            <UFormField
              name="slug"
              data-field="slug"
              label="Адрес на сайте"
              :description="
                slugChanged
                  ? 'Адрес изменён — старые ссылки на страницу перестанут работать'
                  : 'Латиница в нижнем регистре, цифры и дефис'
              "
              :ui="{ label: 'font-semibold', description: slugChanged ? 'text-warning' : undefined }"
            >
              <UInput
                v-model="form.slug"
                placeholder="example-page"
                class="w-full"
                :ui="{ base: 'ps-6', leading: 'pointer-events-none' }"
              >
                <template #leading>
                  <span class="text-sm text-dimmed">/</span>
                </template>
              </UInput>
            </UFormField>
            <UButton
              icon="i-lucide-wand-sparkles"
              label="Сформировать из названия"
              color="neutral"
              variant="soft"
              size="sm"
              block
              @click="generateSlug"
            />
          </EntityFormCard>

          <EntityFormChecklist :items="checklist" />
        </template>
      </EntityFormBody>
    </UForm>
  </div>
</template>
