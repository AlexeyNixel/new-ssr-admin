<script setup lang="ts">
import { useClubApi } from '~~/services/api/club.api';
import type { Club } from '~~/services/types/club.type';
import { clubSchema } from '~/schemas/club.schema';

const props = defineProps<{
  club?: Club;
}>();

const emit = defineEmits<{ close: [boolean] }>();

const clubApi = useClubApi();
const toast = useToast();
const schema = clubSchema;

const { entity: club, pending, notFound } = useModalEntity({
  prop: props.club,
  fetchById: (id) => clubApi.getOneClub(id),
});
const isUpdate = computed(() => !!club.value);

const newClub = ref({
  name: '',
  description: '',
  member: '',
  worktime: '',
  previewFileId: '',
});

watch(
  club,
  (value) => {
    if (!value) return;
    newClub.value = {
      name: value.name || '',
      description: value.description || '',
      member: value.member || '',
      worktime: value.worktime || '',
      previewFileId: value.previewFileId || '',
    };
  },
  { immediate: true }
);

const onSubmit = async () => {
  if (isUpdate.value && club.value) {
    await clubApi.updateClub(club.value.id, newClub.value);
  } else {
    await clubApi.createClub(newClub.value);
  }

  toast.add({ title: isUpdate.value ? 'Клуб обновлён' : 'Клуб создан' });
  emit('close', true);
};
</script>

<template>
  <UModal
    :title="isUpdate ? 'Редактирование клуба' : 'Создание клуба'"
    :description="
      isUpdate
        ? 'Внесите изменения в информацию о клубе'
        : 'Заполните информацию о новом клубе'
    "
    :dismissible="false"
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
          :schema="schema"
          :state="newClub"
          class="space-y-5"
          @submit="onSubmit"
        >
          <UFormField name="previewFileId" label="Изображение клуба">
            <UiUploadImage
              v-model="newClub.previewFileId"
              :preview="club?.preview?.path"
              class="w-full"
            />
          </UFormField>

          <UFormField required name="name" label="Название клуба">
            <UInput
              v-model="newClub.name"
              class="w-full"
              placeholder="Например: Клуб любителей поэзии"
              icon="i-heroicons-user-group-20-solid"
              size="md"
            />
          </UFormField>

          <UFormField name="description" label="Описание">
            <EditorCustom v-model="newClub.description" />
          </UFormField>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
            <UFormField name="member" label="Участники">
              <UInput
                v-model="newClub.member"
                class="w-full"
                placeholder="Например: Все желающие от 16 лет"
                icon="i-heroicons-users-20-solid"
                size="md"
              />
              <p class="text-xs text-neutral-500 dark:text-neutral-400">
                Кто может вступить в клуб
              </p>
            </UFormField>

            <UFormField name="worktime" label="Время работы">
              <UInput
                v-model="newClub.worktime"
                class="w-full"
                placeholder="Например: По пятницам, 18:00–20:00"
                icon="i-heroicons-clock-20-solid"
                size="md"
              />
              <p class="text-xs text-neutral-500 dark:text-neutral-400">
                Расписание встреч
              </p>
            </UFormField>
          </div>

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
              {{ isUpdate ? 'Сохранить изменения' : 'Создать клуб' }}
            </UButton>
          </div>
        </UForm>
      </div>
    </template>
  </UModal>
</template>

<style scoped></style>
