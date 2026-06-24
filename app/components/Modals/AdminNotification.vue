<template>
  <UModal
    :title="
      props.notification ? 'Редактирование уведомления' : 'Создание уведомления'
    "
    description="Заполните форму для отправки уведомления пользователям"
    :dismissible="false"
    @submit="createNotification"
  >
    <template #body>
      <div class="flex flex-col w-full">
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

          <!-- Тип уведомления - ОРИГИНАЛЬНЫЙ ВАРИАНТ -->
          <UFormField name="type" label="Тип уведомления" required>
            <URadioGroup
              v-model="newNotification.type"
              :color="newNotification.type"
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
                props.notification
                  ? 'i-heroicons-pencil-square-20-solid'
                  : 'i-heroicons-plus-20-solid'
              "
            >
              {{ props.notification ? 'Обновить' : 'Создать' }}
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

const startTime = shallowRef();
const endTime = shallowRef();

const newNotification = ref({
  title: props.notification?.title,
  description: props.notification?.description,
  endTime: props.notification?.endTime,
  startTime: props.notification?.startTime,
  type: props.notification?.type,
  isDeleted: props.notification?.isDeleted,
});

if (props.notification) {
  startTime.value = new CalendarDate(
    +dayjs(props.notification.startTime).year(),
    dayjs(props.notification.startTime).month() + 1,
    dayjs(props.notification.startTime).date()
  );

  endTime.value = new CalendarDate(
    +dayjs(props.notification.endTime).year(),
    dayjs(props.notification.endTime).month() + 1,
    dayjs(props.notification.endTime).date()
  );
}

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
];

const createNotification = async () => {
  try {
    newNotification.value.startTime = dayjs(startTime.value).toISOString();
    newNotification.value.endTime = dayjs(endTime.value).toISOString();
    if (!props.notification) {
      await notificationApi.create(newNotification.value);
    } else {
      await notificationApi.update(
        props.notification.id,
        newNotification.value
      );
    }
    emit('close', true);
    toast.add({ title: 'Запись обновлена', color: 'success' });
  } catch (e) {
    toast.add({
      title: 'Произошла ошибка, проверте введеные вами данные',
      color: 'error',
    });
    return e;
  }
};

watch([startTime, endTime], () => {
  newNotification.value.startTime = dayjs(startTime.value).toISOString();
  newNotification.value.endTime = dayjs(endTime.value).toISOString();
});
</script>

<style scoped></style>
