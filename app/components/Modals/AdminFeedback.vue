<template>
  <UModal
    :title="isUpdate ? 'Обращение' : 'Сообщить об ошибке или идее'"
    :description="
      isUpdate
        ? 'Ошибки и пожелания по админке'
        : 'Опишите, что не так или что хочется изменить — задача попадёт в список разработчику'
    "
    :dismissible="false"
  >
    <template #body>
      <div v-if="pending" class="flex items-center justify-center py-12">
        <UIcon name="i-heroicons-arrow-path" class="w-6 h-6 animate-spin text-neutral-400" />
      </div>

      <div v-else-if="notFound" class="py-12 text-center text-neutral-500">Обращение не найдено</div>

      <UForm v-else :schema="schema" :state="form" :disabled="!canEdit" class="space-y-5" @submit="onSubmit">
        <UAlert
          v-if="isUpdate && !canEdit"
          color="neutral"
          variant="subtle"
          icon="i-lucide-lock"
          :title="feedback?.isDone ? 'Обращение уже выполнено' : 'Изменять может только автор и разработчик'"
        />

        <UFormField name="type" label="Что это?" required>
          <URadioGroup
            v-model="form.type"
            :items="typeItems"
            variant="card"
            orientation="horizontal"
            :color="form.type ? FEEDBACK_TYPES[form.type].color : 'primary'"
            :ui="{ fieldset: 'grid grid-cols-1 sm:grid-cols-3 gap-2', item: 'w-full' }"
          >
            <template #label="{ item }">
              <span class="flex items-center gap-2">
                <UIcon :name="FEEDBACK_TYPES[item.value as FeedbackType].icon" class="size-4" />
                {{ item.label }}
              </span>
            </template>
          </URadioGroup>
        </UFormField>

        <UFormField name="title" label="Суть в одной фразе" required>
          <UInput
            v-model="form.title"
            :placeholder="titlePlaceholder"
            maxlength="200"
            class="w-full"
            autofocus
          />
        </UFormField>

        <UFormField
          name="description"
          label="Подробности"
          hint="необязательно"
          description="Что делали, что ожидали увидеть и что получилось"
        >
          <UTextarea v-model="form.description" :rows="4" autoresize class="w-full" />
        </UFormField>

        <UFormField name="pageUrl" label="Страница админки" hint="подставилась сама">
          <UInput v-model="form.pageUrl" icon="i-lucide-link" placeholder="/post" class="w-full" />
        </UFormField>

        <UFormField name="screenshotId" label="Скриншот" hint="необязательно">
          <UiUploadImage
            v-model="form.screenshotId"
            :preview="feedback?.screenshot?.path"
            class="h-40!"
          />
        </UFormField>

        <!-- Ответ разработчика: отметка выполнения и комментарий -->
        <div
          v-if="isUpdate && canManage"
          class="space-y-4 rounded-xl border border-success/30 bg-success/5 p-4"
        >
          <USwitch v-model="form.isDone" label="Выполнено" color="success" />
          <UFormField name="response" label="Ответ автору" description="Что сделано или почему не будет сделано">
            <UTextarea v-model="form.response" :rows="2" autoresize class="w-full" />
          </UFormField>
        </div>

        <div
          v-else-if="feedback?.response"
          class="rounded-xl border border-success/30 bg-success/5 p-4 text-sm"
        >
          <p class="mb-1 font-medium text-success">Ответ разработчика</p>
          <p class="whitespace-pre-line text-default">{{ feedback.response }}</p>
        </div>

        <div class="flex items-center justify-between gap-3 border-t border-default pt-4">
          <UButton
            v-if="isUpdate && canEdit"
            color="error"
            variant="ghost"
            icon="i-lucide-trash-2"
            label="Удалить"
            :loading="saving"
            @click="onDelete"
          />
          <span v-else />

          <div class="flex gap-2">
            <UButton color="neutral" variant="outline" label="Закрыть" @click="emit('close', false)" />
            <UButton
              v-if="canEdit"
              type="submit"
              color="primary"
              :loading="saving"
              :icon="isUpdate ? 'i-lucide-check' : 'i-lucide-send'"
              :label="isUpdate ? 'Сохранить' : 'Отправить'"
            />
          </div>
        </div>
      </UForm>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import type { Feedback, FeedbackType } from '~~/services/types/feedback.type';
import type { User } from '~~/services/types/user.type';
import { useFeedbackApi } from '~~/services/api/feedback.api';
import { feedbackSchema } from '~/schemas/feedback.schema';
import { FEEDBACK_TYPES } from '~/utils/feedbackTypes';

const props = defineProps<{
  feedback?: Feedback;
  /** Страница, с которой открыли форму — подставляется в новое обращение */
  pageUrl?: string;
  canManage?: boolean;
}>();

const emit = defineEmits<{ close: [saved: boolean] }>();
const schema = feedbackSchema;
const toast = useToast();
const feedbackApi = useFeedbackApi();
const user = useCookie<User | null>('user_data');

const { entity: feedback, pending, notFound } = useModalEntity({
  prop: props.feedback,
  fetchById: (id) => feedbackApi.getOneFeedback(id),
  // Не editId: форму открывают с любой страницы, где editId — id другой сущности
  param: 'feedbackId',
});
const isUpdate = computed(() => !!feedback.value);
const canEdit = computed(
  () =>
    !feedback.value ||
    props.canManage ||
    (feedback.value.authorId === user.value?.id && !feedback.value.isDone)
);

const typeItems = (Object.keys(FEEDBACK_TYPES) as FeedbackType[]).map((value) => ({
  value,
  label: FEEDBACK_TYPES[value].label,
  description: FEEDBACK_TYPES[value].hint,
}));

const form = ref<{
  type?: FeedbackType;
  title: string;
  description: string;
  pageUrl: string;
  screenshotId: string;
  isDone: boolean;
  response: string;
}>({
  type: undefined,
  title: '',
  description: '',
  pageUrl: props.pageUrl ?? '',
  screenshotId: '',
  isDone: false,
  response: '',
});

watch(
  feedback,
  (value) => {
    if (!value) return;
    form.value = {
      type: value.type,
      title: value.title,
      description: value.description ?? '',
      pageUrl: value.pageUrl ?? '',
      screenshotId: value.screenshotId ?? '',
      isDone: value.isDone,
      response: value.response ?? '',
    };
  },
  { immediate: true }
);

const titlePlaceholder = computed(
  () =>
    ({
      BUG: 'Например: не сохраняется картинка у события',
      CHANGE: 'Например: в списке книг не хватает фильтра по году',
      IDEA: 'Например: сделать копирование новости',
    })[form.value.type ?? 'BUG']
);

const saving = ref(false);

const onSubmit = async () => {
  saving.value = true;
  try {
    const content = {
      type: form.value.type,
      title: form.value.title.trim(),
      description: form.value.description.trim() || null,
      pageUrl: form.value.pageUrl.trim() || null,
      screenshotId: form.value.screenshotId || null,
    };
    if (feedback.value) {
      await feedbackApi.update(feedback.value.id, {
        ...content,
        ...(props.canManage && { isDone: form.value.isDone, response: form.value.response.trim() || null }),
      });
      toast.add({ title: 'Обращение сохранено', color: 'success' });
    } else {
      await feedbackApi.create(content);
      toast.add({
        title: 'Спасибо! Обращение отправлено',
        description: 'Разработчик увидит его в списке, а вы — когда оно будет выполнено',
        color: 'success',
        icon: 'i-lucide-check-circle',
      });
    }
    emit('close', true);
  } catch {
    toast.add({ title: 'Не удалось сохранить, попробуйте ещё раз', color: 'error' });
  } finally {
    saving.value = false;
  }
};

const onDelete = async () => {
  if (!feedback.value || !confirm('Удалить обращение?')) return;
  saving.value = true;
  try {
    await feedbackApi.update(feedback.value.id, { isDeleted: true });
    toast.add({ title: 'Обращение удалено', color: 'success' });
    emit('close', true);
  } catch {
    toast.add({ title: 'Не удалось удалить', color: 'error' });
  } finally {
    saving.value = false;
  }
};
</script>
