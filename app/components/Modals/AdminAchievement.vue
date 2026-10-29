<script setup lang="ts">
import { useAchievementApi } from '~~/services/api/achievement.api';
import type { Achievement } from '~~/services/types/achievement.type';
import { achievementSchema } from '~/schemas/achievement.schema';

const props = defineProps<{
  achievement?: Achievement;
}>();

const emit = defineEmits<{ close: [boolean] }>();

const toast = useToast();
const achievementApi = useAchievementApi();
const schema = achievementSchema;
const isLoading = ref(false);

const { entity: achievement, pending, notFound } = useModalEntity({
  prop: props.achievement,
  fetchById: (id) => achievementApi.getOneAchievement(id),
});

const isUpdate = computed(() => !!achievement.value);

const form = ref({
  label: '',
  count: '',
  isDeleted: false,
});

watch(
  achievement,
  (value) => {
    if (!value) return;
    form.value = {
      label: value.label ?? '',
      count: value.count ?? '',
      isDeleted: value.isDeleted ?? false,
    };
  },
  { immediate: true }
);

const onSubmit = async () => {
  isLoading.value = true;

  const payload: Partial<Achievement> = {
    label: form.value.label.trim(),
    count: form.value.count.trim(),
  };

  if (isUpdate.value) {
    payload.isDeleted = form.value.isDeleted;
  }

  try {
    if (isUpdate.value && achievement.value) {
      await achievementApi.updateAchievement(achievement.value.id, payload);
      toast.add({ title: 'Счётчик обновлён' });
    } else {
      await achievementApi.createAchievement(payload);
      toast.add({ title: 'Счётчик создан' });
    }

    emit('close', true);
  } catch (error) {
    const message = (error as { data?: { message?: string } })?.data?.message;
    toast.add({
      title: 'Не удалось сохранить счётчик',
      description: typeof message === 'string' ? message : undefined,
      color: 'error',
    });
  } finally {
    isLoading.value = false;
  }
};
</script>

<template>
  <UModal
    :title="isUpdate ? 'Редактирование достижения' : 'Новое достижение'"
    :description="
      isUpdate
        ? 'Счётчик в блоке достижений на главной странице'
        : 'Счётчик появится в блоке достижений на главной странице'
    "
    :dismissible="false"
  >
    <template #body>
      <div v-if="pending" class="flex items-center justify-center py-12">
        <UIcon name="i-heroicons-arrow-path" class="w-6 h-6 animate-spin text-neutral-400" />
      </div>

      <div v-else-if="notFound" class="py-12 text-center text-neutral-500 dark:text-neutral-400">
        Запись не найдена
      </div>

      <div v-else class="flex flex-col w-full">
        <UForm :schema="schema" :state="form" class="space-y-5" @submit="onSubmit">
          <UFormField
            required
            name="label"
            label="Подпись"
            help="Что считаем: «книг», «игр», «лет», «читателей»"
          >
            <UInput
              v-model="form.label"
              class="w-full"
              placeholder="книг"
              icon="i-heroicons-tag-20-solid"
              size="md"
            />
          </UFormField>

          <UFormField
            required
            name="count"
            label="Значение"
            help="Число как есть: 1200 или 12 000+"
          >
            <UInput
              v-model="form.count"
              class="w-full"
              placeholder="1200"
              icon="i-heroicons-hashtag-20-solid"
              size="md"
            />
          </UFormField>

          <UFormField v-if="isUpdate" label="Видимость">
            <div class="flex items-center justify-between gap-4 rounded-xl bg-elevated/60 px-4 py-3">
              <div class="min-w-0">
                <p class="text-sm font-medium text-highlighted">
                  {{ form.isDeleted ? 'Скрыт с сайта' : 'Показывается на сайте' }}
                </p>
                <p class="mt-0.5 text-xs text-muted">
                  Скрытый счётчик остаётся в админке, но пропадает с главной
                </p>
              </div>
              <USwitch v-model="form.isDeleted" />
            </div>
          </UFormField>

          <div class="flex items-center justify-end gap-3 border-t border-default pt-4 mt-2">
            <UButton type="submit" color="primary" size="md" :loading="isLoading">
              {{ isUpdate ? 'Сохранить' : 'Создать' }}
            </UButton>
          </div>
        </UForm>
      </div>
    </template>
  </UModal>
</template>
