<template>
  <UModal
    :title="
      isUpdate ? 'Редактирование уведомления' : 'Создание уведомления'
    "
    description="Заполните форму для отправки уведомления пользователям"
    :dismissible="false"
    @submit="createNotification"
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
        <!-- Форма - элементы на всю ширину -->
        <UForm
          :schema="schema"
          :state="newNotification"
          class="space-y-5"
          @submit="createNotification"
        >
          <!-- Заголовок -->
          <UFormField name="title" label="Заголовок" required>
            <UInput
              v-model="newNotification.title"
              placeholder="Например: Технические работы"
              icon="i-heroicons-pencil-square"
              size="md"
              class="w-full"
            />
          </UFormField>

          <!-- Описание -->
          <UFormField name="description" label="Описание">
            <UTextarea
              v-model="newNotification.description"
              placeholder="Опишите детали уведомления"
              :rows="3"
              size="md"
              class="w-full"
            />
          </UFormField>

          <!-- Тип уведомления -->
          <UFormField name="type" label="Тип уведомления" required>
            <URadioGroup
              v-model="newNotification.type"
              :color="newNotification.type ? typeColorMap[newNotification.type] : undefined"
              :items="notificationTypes"
              variant="card"
              class="w-full"
            >
              <template #label="{ item }">
                <div class="flex items-center gap-2 w-full">
                  <Icon class="text-xl" :name="item.icon" />
                  <span>{{ item.label }}</span>
                </div>
              </template>
            </URadioGroup>
          </UFormField>

          <!-- Превью -->
          <div class="space-y-2">
            <h4
              class="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2"
            >
              <UIcon name="i-heroicons-eye" class="w-4 h-4" />
              Превью
            </h4>
            <div
              class="flex items-start gap-3 rounded-lg border-l-4 p-4"
              :class="previewStyle.wrapper"
            >
              <UIcon
                :name="previewStyle.icon"
                class="w-5 h-5 shrink-0 mt-0.5"
                :class="previewStyle.iconClass"
              />
              <div class="min-w-0">
                <p class="font-medium text-sm" :class="previewStyle.titleClass">
                  {{ newNotification.title || 'Заголовок уведомления' }}
                </p>
                <p class="text-sm mt-0.5" :class="previewStyle.descClass">
                  {{ newNotification.description || 'Здесь появится описание уведомления' }}
                </p>
              </div>
            </div>
          </div>

          <!-- Время показа -->
          <div class="space-y-3">
            <h4
              class="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2"
            >
              <UIcon name="i-heroicons-clock" class="w-4 h-4" />
              Время показа
            </h4>

            <div class="space-y-4">
              <!-- Время начала -->
              <UFormField name="startTime" label="Начало" required>
                <UPopover class="w-full">
                  <UButton
                    color="neutral"
                    variant="subtle"
                    icon="i-lucide-calendar"
                    class="w-full justify-start"
                  >
                    {{
                      startTime
                        ? dayjs(startTime).format('DD.MM.YYYY')
                        : 'Выберите дату'
                    }}
                  </UButton>

                  <template #content>
                    <UCalendar v-model="startTime" class="p-2" />
                  </template>
                </UPopover>
              </UFormField>

              <!-- Время окончания -->
              <UFormField name="endTime" label="Окончание" required>
                <UPopover class="w-full">
                  <UButton
                    color="neutral"
                    variant="subtle"
                    icon="i-lucide-calendar"
                    class="w-full justify-start"
                  >
                    {{
                      endTime
                        ? dayjs(endTime).format('DD.MM.YYYY')
                        : 'Выберите дату'
                    }}
                  </UButton>

                  <template #content>
                    <UCalendar v-model="endTime" class="p-2" />
                  </template>
                </UPopover>
              </UFormField>
            </div>
          </div>

          <div
            class="flex items-center justify-end gap-3 px-6 py-4 bg-gray-50 dark:bg-gray-800/30 rounded-b-2xl border-t border-gray-200 dark:border-gray-700"
          >
            <UButton
              type="submit"
              color="primary"
              size="md"
              class="min-w-[120px]"
              :icon="
                isUpdate
                  ? 'i-heroicons-pencil-square-20-solid'
                  : 'i-heroicons-plus-20-solid'
              "
            >
              {{ isUpdate ? 'Обновить' : 'Создать' }}
            </UButton>
          </div>
        </UForm>
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import type { Notification } from '~~/services/types/notification.type';
import { useNotificationApi } from '~~/services/api/notification.api';
import dayjs from 'dayjs';
import { CalendarDate } from '@internationalized/date';
import { notificationSchema } from '~/schemas/notification.schema';

const props = defineProps<{
  notification?: Notification;
}>();

const emit = defineEmits(['close']);
const schema = notificationSchema;
const toast = useToast();
const notificationApi = useNotificationApi();

const { entity: notification, pending, notFound } = useModalEntity({
  prop: props.notification,
  fetchById: (id) => notificationApi.getOneNotification(id),
});
const isUpdate = computed(() => !!notification.value);

const startTime = shallowRef();
const endTime = shallowRef();

const newNotification = ref<{
  title?: string;
  description?: string;
  endTime?: string;
  startTime?: string;
  type?: Notification['type'];
  isDeleted?: boolean;
}>({
  title: undefined,
  description: undefined,
  endTime: undefined,
  startTime: undefined,
  type: undefined,
  isDeleted: undefined,
});

watch(
  notification,
  (value) => {
    if (!value) return;
    newNotification.value = {
      title: value.title,
      description: value.description,
      endTime: value.endTime,
      startTime: value.startTime,
      type: value.type,
      isDeleted: value.isDeleted,
    };

    startTime.value = new CalendarDate(
      +dayjs(value.startTime).year(),
      dayjs(value.startTime).month() + 1,
      dayjs(value.startTime).date()
    );

    endTime.value = new CalendarDate(
      +dayjs(value.endTime).year(),
      dayjs(value.endTime).month() + 1,
      dayjs(value.endTime).date()
    );
  },
  { immediate: true }
);

const notificationTypes = [
  {
    value: 'success',
    label: 'Успех',
    color: 'green',
    icon: 'i-heroicons-check-circle-16-solid',
    description: 'Для информационных сообщений',
  },
  {
    value: 'warning',
    label: 'Предупреждение',
    color: 'yellow',
    icon: 'i-heroicons-exclamation-triangle-16-solid',
    description: 'Для предупреждений и важных уведомлений',
  },
  {
    value: 'error',
    label: 'Ошибка',
    color: 'red',
    icon: 'i-heroicons-x-circle-16-solid',
    description: 'Для критических проблем',
  },
  {
    value: 'festive',
    label: 'Праздничное',
    color: 'purple',
    icon: 'i-heroicons-gift-16-solid',
    description: 'Для праздничных поздравлений и акций',
  },
];

const typeColorMap: Record<NonNullable<Notification['type']>, string> = {
  success: 'success',
  warning: 'warning',
  error: 'error',
  festive: 'purple',
};

const previewStyles: Record<
  NonNullable<Notification['type']>,
  { wrapper: string; icon: string; iconClass: string; titleClass: string; descClass: string }
> = {
  success: {
    wrapper: 'bg-green-50 border-green-500 dark:bg-green-950/40 dark:border-green-500',
    icon: 'i-heroicons-check-circle-16-solid',
    iconClass: 'text-green-600 dark:text-green-400',
    titleClass: 'text-green-900 dark:text-green-100',
    descClass: 'text-green-700 dark:text-green-300',
  },
  warning: {
    wrapper: 'bg-yellow-50 border-yellow-500 dark:bg-yellow-950/40 dark:border-yellow-500',
    icon: 'i-heroicons-exclamation-triangle-16-solid',
    iconClass: 'text-yellow-600 dark:text-yellow-400',
    titleClass: 'text-yellow-900 dark:text-yellow-100',
    descClass: 'text-yellow-700 dark:text-yellow-300',
  },
  error: {
    wrapper: 'bg-red-50 border-red-500 dark:bg-red-950/40 dark:border-red-500',
    icon: 'i-heroicons-x-circle-16-solid',
    iconClass: 'text-red-600 dark:text-red-400',
    titleClass: 'text-red-900 dark:text-red-100',
    descClass: 'text-red-700 dark:text-red-300',
  },
  festive: {
    wrapper: 'bg-purple-50 border-purple-500 dark:bg-purple-950/40 dark:border-purple-500',
    icon: 'i-heroicons-gift-16-solid',
    iconClass: 'text-purple-600 dark:text-purple-400',
    titleClass: 'text-purple-900 dark:text-purple-100',
    descClass: 'text-purple-700 dark:text-purple-300',
  },
};

const defaultPreviewStyle = {
  wrapper: 'bg-gray-50 border-gray-300 dark:bg-gray-800/40 dark:border-gray-600',
  icon: 'i-heroicons-bell-16-solid',
  iconClass: 'text-gray-500 dark:text-gray-400',
  titleClass: 'text-gray-700 dark:text-gray-200',
  descClass: 'text-gray-500 dark:text-gray-400',
};

const previewStyle = computed(() =>
  newNotification.value.type ? previewStyles[newNotification.value.type] : defaultPreviewStyle
);

const createNotification = async () => {
  try {
    newNotification.value.startTime = dayjs(startTime.value).toISOString();
    newNotification.value.endTime = dayjs(endTime.value).toISOString();
    if (isUpdate.value && notification.value) {
      await notificationApi.update(notification.value.id, newNotification.value);
    } else {
      await notificationApi.create(newNotification.value);
    }
    emit('close', true);
    toast.add({ title: 'Запись обновлена', color: 'success' });
  } catch {
    toast.add({
      title: 'Произошла ошибка, проверте введеные вами данные',
      color: 'error',
    });
  }
};

watch([startTime, endTime], () => {
  newNotification.value.startTime = dayjs(startTime.value).toISOString();
  newNotification.value.endTime = dayjs(endTime.value).toISOString();
});
</script>

<style scoped></style>
