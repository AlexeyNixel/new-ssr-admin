<script setup lang="ts">
import { useMapPointApi } from '~~/services/api/map-point.api';
import type { IMapPoint } from '~~/services/types/map-point.type';
import { mapPointSchema } from '~/schemas/map-point.schema';

const props = defineProps<{
  mapPoint?: IMapPoint;
}>();

const emit = defineEmits<{ close: [boolean] }>();

const toast = useToast();
const mapPointApi = useMapPointApi();
const isUpdate = !!props.mapPoint;
const isLoading = ref(false);
const schema = mapPointSchema;

const position = ref<string>();

const newMapPoint = ref<Partial<IMapPoint>>({
  title: props.mapPoint?.title || '',
  description: props.mapPoint?.description || '',
  content: props.mapPoint?.content || '',
  imageFileId: props.mapPoint?.imageFileId || '',
  lat: props.mapPoint?.lat,
  lng: props.mapPoint?.lng,
  preset: props.mapPoint?.preset || '',
  isDeleted: props.mapPoint?.isDeleted || false,
});

const onSubmit = async () => {
  isLoading.value = true;

  console.log(position.value?.split(', '));

  if (position.value) {
    newMapPoint.value.lat = Number(position.value?.split(', ')[0]);
    newMapPoint.value.lng = Number(position.value?.split(', ')[1]);
  }

  try {
    if (isUpdate && props.mapPoint) {
      await mapPointApi.updateMapPoint(props.mapPoint.id, newMapPoint.value);
      toast.add({ title: 'Точка обновлена' });
    } else {
      await mapPointApi.createMapPoint(newMapPoint.value);
      toast.add({ title: 'Точка создана' });
    }

    emit('close', true);
  } finally {
    isLoading.value = false;
  }
};
</script>

<template>
  <UModal
    :title="
      isUpdate ? 'Редактирование точки на карте' : 'Создание точки на карте'
    "
    :description="
      isUpdate
        ? 'Внесите изменения в информацию о точке'
        : 'Заполните информацию о новой точке на карте'
    "
    :dismissible="false"
  >
    <template #body>
      <div class="flex flex-col w-full">
        <UForm
          :schema="schema"
          :state="newMapPoint"
          class="space-y-5"
          @submit="onSubmit"
        >
          <UFormField name="image" label="Изображение точки">
            <UiUploadImage
              v-model="newMapPoint.imageFileId!"
              :preview="props.mapPoint?.imageFileId"
              class="w-full"
            />
          </UFormField>

          <UFormField name="description" label="Введите место">
            <UTextarea
              v-model="newMapPoint.description"
              placeholder="Введите место"
              :rows="3"
              class="w-full"
            />
          </UFormField>

          <UFormField required name="title" label="Название">
            <UInput
              v-model="newMapPoint.title"
              class="w-full"
              placeholder="Например: Центральная библиотека"
              icon="i-heroicons-map-pin-20-solid"
              size="md"
            />
          </UFormField>

          <UFormField name="content" label="Подробное содержание">
            <EditorCustom v-model="newMapPoint.content" />
          </UFormField>

          <UFormField required name="lng" label="Позиция">
            <UInput
              v-model="position"
              step="any"
              placeholder="37.618423"
              icon="i-heroicons-globe-alt-20-solid"
              class="w-full"
            />
          </UFormField>

          <UFormField name="preset" label="Пресет иконки">
            <UInput
              v-model="newMapPoint.preset"
              class="w-full"
              placeholder="Например: islands#blueDotIcon"
              icon="i-heroicons-tag-20-solid"
              size="md"
            />
            <p class="text-xs text-neutral-500 dark:text-neutral-400">
              Идентификатор стиля метки на карте
            </p>
          </UFormField>

          <UFormField label="Статус точки">
            <div
              class="p-4 bg-neutral-50 dark:bg-neutral-800/50 rounded-xl border border-neutral-200 dark:border-neutral-700"
            >
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <UIcon
                    :name="
                      newMapPoint.isDeleted
                        ? 'i-heroicons-eye-slash-20-solid'
                        : 'i-heroicons-eye-20-solid'
                    "
                    class="w-4 h-4"
                    :class="
                      newMapPoint.isDeleted
                        ? 'text-neutral-500'
                        : 'text-green-500'
                    "
                  />
                  <p
                    class="text-sm font-medium text-neutral-900 dark:text-white"
                  >
                    {{
                      newMapPoint.isDeleted ? 'Точка скрыта' : 'Точка активна'
                    }}
                  </p>
                </div>
                <USwitch v-model="newMapPoint.isDeleted" />
              </div>
            </div>
            <p class="text-xs text-neutral-500 dark:text-neutral-400">
              {{
                !newMapPoint.isDeleted
                  ? 'Точка видна всем пользователям'
                  : 'Точка не отображается на карте'
              }}
            </p>
          </UFormField>

          <div
            class="flex items-center justify-end gap-3 pt-4 mt-2 border-t border-neutral-200 dark:border-neutral-700"
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
              {{ isUpdate ? 'Сохранить изменения' : 'Создать точку' }}
            </UButton>
          </div>
        </UForm>
      </div>
    </template>
  </UModal>
</template>

<style scoped></style>
