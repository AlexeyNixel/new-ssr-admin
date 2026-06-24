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
const isUpdate = !!props.club;
const schema = clubSchema;

const newClub = ref({
  name: props.club?.name || '',
  description: props.club?.description || '',
  member: props.club?.member || '',
  worktime: props.club?.worktime || '',
  previewFileId: props.club?.previewFileId || '',
});

const onSubmit = async () => {
  if (isUpdate && props.club) {
    await clubApi.updateClub(props.club.id, newClub.value);
  } else {
    await clubApi.createClub(newClub.value);
  }

  toast.add({ title: isUpdate ? 'Клуб обновлён' : 'Клуб создан' });
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
      <div class="flex flex-col w-full">
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
