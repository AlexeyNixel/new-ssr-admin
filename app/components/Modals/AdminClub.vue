<script setup lang="ts">
import type { Club } from '~~/services/types/club.type';

const props = defineProps<{
  club: Club;
}>();

const newClub = ref({
  name: props.club.name || '',
  description: props.club.description || '',
  previewFileId: props.club.previewFileId || '',
});
</script>

<template>
  <UModal
    :title="club ? 'Редактирование клуба' : 'Создание клуба'"
    :dismissible="false"
    :description="
      club
        ? 'Внесите изменения в информацию о клубе'
        : 'Заполните информацию о новом клубе'
    "
  >
    <template #body>
      <div>
        <UiUploadImage
          v-model="newClub.previewFileId"
          :preview="club.preview.path"
        />
      </div>
    </template>
  </UModal>
</template>

<style scoped></style>
