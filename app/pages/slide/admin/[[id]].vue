<script setup lang="ts">
import { useSlideApi } from '~~/services/api/slide.api';
import type { Slide } from '~~/services/types/slide.type';
import { slideSchema } from '~/schemas/slide.schema';

const route = useRoute();
const slideId = route.params.id as string | undefined;
const isUpdate = !!slideId;

const toast = useToast();
const slideApi = useSlideApi();

const form = reactive({
  imageFileId: undefined as string | undefined,
  postId: undefined as string | undefined,
  url: '',
  slideOrder: 0 as number | null,
  isDeleted: false,
});
const imagePath = ref('');

const loaded = ref<Slide>();
const loadError = ref(false);

if (slideId) {
  try {
    const data = await slideApi.getOneSlide(slideId);
    loaded.value = data;
    Object.assign(form, {
      imageFileId: data.imageFileId || undefined,
      postId: data.postId || undefined,
      url: data.url ?? '',
      slideOrder: data.slideOrder ?? 0,
      isDeleted: !!data.isDeleted,
    });
    imagePath.value = data.image?.path ?? '';
  } catch {
    loadError.value = true;
  }
}

const formRef = useTemplateRef('formRef');

// UFileUpload сообщает форме об изменении ещё до окончания загрузки —
// перепроверяем изображение, когда id уже известен
watch(
  () => form.imageFileId,
  () => formRef.value?.validate({ name: 'imageFileId', silent: true })
);

const { isDirty, markSaved, onError } = useEntityForm({
  snapshot: () => ({ ...form, imagePath: imagePath.value }),
  submit: () => formRef.value?.submit(),
  fieldLabels: {
    imageFileId: 'Изображение',
    postId: 'Куда ведёт слайд',
    url: 'Внешняя ссылка',
    slideOrder: 'Порядок',
  },
});

const status = computed(() =>
  publicationStatus(isUpdate, form.isDeleted, { shown: 'Активен', hidden: 'Скрыт', created: 'Новый' })
);

const hasUrl = computed(() => form.url.trim().length > 0);

const checklist = computed(() => [
  { label: 'Изображение', done: !!form.imageFileId },
  { label: 'Ссылка или новость', done: hasUrl.value || !!form.postId },
]);

// ---------- Сохранение ----------

const saving = ref(false);

const onSubmit = async () => {
  if (saving.value) return;
  saving.value = true;

  const payload: Partial<Slide> = {
    imageFileId: form.imageFileId,
    url: form.url.trim(),
    slideOrder: form.slideOrder ?? 0,
    isDeleted: form.isDeleted,
    // пустой postId бэкенд не принимает — не отправляем
    ...(form.postId ? { postId: form.postId } : {}),
  };

  try {
    if (isUpdate) {
      await slideApi.updateSlide(slideId!, payload);
      toast.add({ title: 'Слайд обновлён', color: 'success', icon: 'i-lucide-circle-check' });
    } else {
      await slideApi.createSlide(payload);
      toast.add({ title: 'Слайд создан', color: 'success', icon: 'i-lucide-circle-check' });
    }
    markSaved();
    await navigateTo('/slide');
  } catch {
    toast.add({
      title: 'Не удалось сохранить слайд',
      description: 'Проверьте соединение и попробуйте ещё раз',
      color: 'error',
    });
  } finally {
    saving.value = false;
  }
};

useHead({ title: isUpdate ? 'НОМБ | Редактирование слайда' : 'НОМБ | Новый слайд' });
</script>

<template>
  <div class="min-h-screen bg-muted">
    <EntityFormNotFound
      v-if="loadError"
      title="Слайд не найден"
      back-to="/slide"
      back-label="К списку слайдов"
    />

    <UForm
      v-else
      ref="formRef"
      :schema="slideSchema"
      :state="form"
      @submit="onSubmit"
      @error="onError"
    >
      <EntityFormHeader
        back-to="/slide"
        back-label="К списку слайдов"
        section="Слайдер на главной"
        :title="isUpdate ? loaded?.image?.originalName || 'Редактирование слайда' : 'Новый слайд'"
        :status="status"
        :is-dirty="isDirty"
        :saving="saving"
        :submit-label="isUpdate ? 'Сохранить' : 'Создать слайд'"
      />

      <EntityFormBody>
        <EntityFormCard title="Изображение" icon="i-lucide-image">
          <UFormField
            name="imageFileId"
            data-field="imageFileId"
            description="Размер 1270 × 500 px, до 5 МБ"
            required
          >
            <template #default="{ error }">
              <PostCover
                v-model="form.imageFileId"
                v-model:path="imagePath"
                aspect="1270 / 500"
                alt="Изображение слайда"
                :invalid="!!error"
              />
            </template>
          </UFormField>
        </EntityFormCard>

        <EntityFormCard title="Куда ведёт слайд" icon="i-lucide-mouse-pointer-click">
          <UFormField
            name="postId"
            data-field="postId"
            label="Новость"
            description="При клике на слайд откроется выбранная новость"
          >
            <SlidePostSelect v-model="form.postId" />
          </UFormField>

          <UFormField
            name="url"
            data-field="url"
            label="Внешняя ссылка"
            description="Если указана, слайд ведёт по ней, а не на новость"
          >
            <UInput
              v-model="form.url"
              placeholder="https://…"
              icon="i-lucide-link"
              class="w-full"
            />
          </UFormField>

          <UAlert
            v-if="hasUrl && form.postId"
            color="warning"
            variant="subtle"
            icon="i-lucide-info"
            title="Указаны и новость, и ссылка"
            description="Слайд будет вести по внешней ссылке — у неё приоритет."
          />
        </EntityFormCard>

        <template #aside>
          <EntityFormCard title="Публикация" icon="i-lucide-send">
            <EntityFormPublishSwitch
              v-model="form.isDeleted"
              shown-text="Слайд показывается на главной"
              hidden-text="Слайд скрыт"
            />

            <UFormField
              name="slideOrder"
              data-field="slideOrder"
              label="Порядок показа"
              description="Чем меньше число, тем раньше слайд"
            >
              <UInputNumber v-model="form.slideOrder" :min="0" class="w-full" />
            </UFormField>
          </EntityFormCard>

          <EntityFormChecklist :items="checklist" />
        </template>
      </EntityFormBody>
    </UForm>
  </div>
</template>
