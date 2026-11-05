<script setup lang="ts">
import { usePodcastApi } from '~~/services/api/podcast.api';
import type { Podcast } from '~~/services/types/podcast.type';
import { podcastSchema } from '~/schemas/podcast.schema';

const props = defineProps<{
  podcast?: Podcast;
}>();

const emit = defineEmits<{ close: [boolean] }>();

const podcastApi = usePodcastApi();
const toast = useToast();
const schema = podcastSchema;
const isLoading = ref(false);

const { entity: podcast, pending, notFound } = useModalEntity({
  prop: props.podcast,
  fetchById: (id) => podcastApi.getOnePodcast(id),
});
const isUpdate = computed(() => !!podcast.value);

const newPodcast = ref({
  title: '',
  description: '',
  audioFileId: '',
});

watch(
  podcast,
  (value) => {
    if (!value) return;
    newPodcast.value = {
      title: value.title || '',
      description: value.description || '',
      audioFileId: value.audioFileId || '',
    };
  },
  { immediate: true },
);

const onSubmit = async () => {
  isLoading.value = true;

  const payload = {
    title: newPodcast.value.title.trim(),
    description: newPodcast.value.description || null,
    audioFileId: newPodcast.value.audioFileId || null,
  };

  try {
    if (isUpdate.value && podcast.value) {
      await podcastApi.updatePodcast(podcast.value.id, payload);
      toast.add({ title: 'Подкаст обновлён' });
    } else {
      await podcastApi.createPodcast(payload);
      toast.add({ title: 'Подкаст создан' });
    }

    emit('close', true);
  } catch (error) {
    const message = (error as { data?: { message?: string } })?.data?.message;
    toast.add({
      title: 'Не удалось сохранить подкаст',
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
    :title="isUpdate ? 'Редактирование подкаста' : 'Создание подкаста'"
    :description="
      isUpdate
        ? 'Внесите изменения в информацию о подкасте'
        : 'Заполните информацию о новом подкасте'
    "
    :dismissible="false"
  >
    <template #body>
      <div
        v-if="pending"
        class="flex items-center justify-center py-12"
      >
        <UIcon
          name="i-heroicons-arrow-path"
          class="h-6 w-6 animate-spin text-neutral-400"
        />
      </div>

      <div
        v-else-if="notFound"
        class="py-12 text-center text-neutral-500 dark:text-neutral-400"
      >
        Запись не найдена
      </div>

      <div
        v-else
        class="flex w-full flex-col"
      >
        <UForm
          :schema="schema"
          :state="newPodcast"
          class="space-y-5"
          @submit="onSubmit"
        >
          <UFormField
            required
            name="title"
            label="Название подкаста"
          >
            <UInput
              v-model="newPodcast.title"
              class="w-full"
              placeholder="Например: Выпуск №1. Как полюбить чтение"
              icon="i-heroicons-musical-note-20-solid"
              size="md"
            />
          </UFormField>

          <UFormField
            name="description"
            label="Описание"
          >
            <UTextarea
              v-model="newPodcast.description"
              class="w-full"
              placeholder="О чём этот выпуск"
              :rows="3"
            />
          </UFormField>

          <UFormField
            name="audioFileId"
            label="Аудиофайл"
          >
            <UiUploadAudio
              v-model="newPodcast.audioFileId"
              :preview="podcast?.audio?.path"
              :preview-name="podcast?.audio?.originalName"
              class="w-full"
            />
            <p class="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
              MP3, OGG, WAV, M4A и другие аудиоформаты. Файл хранится в Silo.
            </p>
          </UFormField>

          <div
            class="mt-2 flex items-center justify-end gap-3 border-t border-neutral-200 pt-4 dark:border-neutral-700"
          >
            <UButton
              type="submit"
              color="primary"
              size="md"
              class="min-w-[160px]"
              :loading="isLoading"
              :icon="
                isUpdate
                  ? 'i-heroicons-pencil-square-20-solid'
                  : 'i-heroicons-plus-20-solid'
              "
            >
              {{ isUpdate ? 'Сохранить изменения' : 'Создать подкаст' }}
            </UButton>
          </div>
        </UForm>
      </div>
    </template>
  </UModal>
</template>

<style scoped></style>
