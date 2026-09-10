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
const isLoading = ref(false);
const schema = mapPointSchema;

const { entity: mapPoint, pending, notFound } = useModalEntity({
  prop: props.mapPoint,
  fetchById: (id) => mapPointApi.getOneMapPoint(id),
});
const isUpdate = computed(() => !!mapPoint.value);

const position = ref<string>();

const newMapPoint = ref<Partial<IMapPoint>>({
  title: '',
  description: '',
  content: '',
  imageFileId: undefined,
  lat: undefined,
  lng: undefined,
  preset: '',
  isDeleted: false,
});

watch(
  mapPoint,
  (value) => {
    if (!value) return;
    newMapPoint.value = {
      title: value.title || '',
      description: value.description || '',
      content: value.content || '',
      imageFileId: value.imageFileId || undefined,
      lat: value.lat,
      lng: value.lng,
      preset: value.preset || '',
      isDeleted: value.isDeleted || false,
    };
    if (value.lat != null && value.lng != null) {
      position.value = `${value.lat}, ${value.lng}`;
    }
  },
  { immediate: true }
);

const onSubmit = async () => {
  isLoading.value = true;

  if (position.value) {
    newMapPoint.value.lat = Number(position.value?.split(', ')[0]);
    newMapPoint.value.lng = Number(position.value?.split(', ')[1]);
  }

  try {
    if (isUpdate.value && mapPoint.value) {
      await mapPointApi.updateMapPoint(mapPoint.value.id, newMapPoint.value);
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
          :state="newMapPoint"
          class="space-y-5"
          @submit="onSubmit"
        >
          <UFormField name="image" label="Изображение точки">
            <UiUploadImage
              v-model="newMapPoint.imageFileId!"
              :preview="mapPoint?.imageFileId"
              class="w-full"
            />
          </UFormField>

          <UFormField name="description" label="Введите адрес">
            <UInput
              v-model="newMapPoint.description"
              placeholder="г. Новосибирск, Красный проспект 26"
              icon="i-heroicons-map-pin-20-solid"
              class="w-full"
            />
          </UFormField>

          <UFormField required name="title" label="Название">
            <UInput
              v-model="newMapPoint.title"
              class="w-full"
              placeholder="Например: НОМБ"
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

          <!--          <UFormField label="Статус точки">-->
          <!--            <div-->
          <!--              class="p-4 bg-neutral-50 dark:bg-neutral-800/50 rounded-xl border border-neutral-200 dark:border-neutral-700"-->
          <!--            >-->
          <!--              <div class="flex items-center justify-between">-->
          <!--                <div class="flex items-center gap-2">-->
          <!--                  <UIcon-->
          <!--                    :name="-->
          <!--                      newMapPoint.isDeleted-->
          <!--                        ? 'i-heroicons-eye-slash-20-solid'-->
          <!--                        : 'i-heroicons-eye-20-solid'-->
          <!--                    "-->
          <!--                    class="w-4 h-4"-->
          <!--                    :class="-->
          <!--                      newMapPoint.isDeleted-->
          <!--                        ? 'text-neutral-500'-->
          <!--                        : 'text-green-500'-->
          <!--                    "-->
          <!--                  />-->
          <!--                  <p-->
          <!--                    class="text-sm font-medium text-neutral-900 dark:text-white"-->
          <!--                  >-->
          <!--                    {{-->
          <!--                      newMapPoint.isDeleted ? 'Точка скрыта' : 'Точка активна'-->
          <!--                    }}-->
          <!--                  </p>-->
          <!--                </div>-->
          <!--                <USwitch v-model="newMapPoint.isDeleted" />-->
          <!--              </div>-->
          <!--            </div>-->
          <!--            <p class="text-xs text-neutral-500 dark:text-neutral-400">-->
          <!--              {{-->
          <!--                !newMapPoint.isDeleted-->
          <!--                  ? 'Точка видна всем пользователям'-->
          <!--                  : 'Точка не отображается на карте'-->
          <!--              }}-->
          <!--            </p>-->
          <!--          </UFormField>-->

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
