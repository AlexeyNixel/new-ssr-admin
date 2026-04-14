<script setup lang="ts">
import type { Notification } from '~~/services/types/notification.type';
import {
  getLocalTimeZone,
  CalendarDate,
  DateFormatter,
} from '@internationalized/date';

const props = defineProps<{
  notification?: Notification;
}>();

const newNotification = ref({
  title: props.notification?.title,
  description: props.notification?.description,
  endTime: props.notification?.endTime,
  startTime: props.notification?.startTime,
  type: props.notification?.type,
  isDeleted: props.notification?.isDeleted,
});

const startTime = shallowRef();
const endTime = shallowRef();

// Типы уведомлений с цветами и иконками
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

const selectedType = ref(notificationTypes[0].value);
</script>

<template>
  <UModal>
    <template #content>
      <div class="flex flex-col w-full p-5">
        <!-- Заголовок -->
        <div
          class="flex items-center justify-between border-b border-gray-100 dark:border-gray-800"
        >
          <div>
            <h3 class="text-base font-semibold text-gray-900 dark:text-white">
              Создание уведомления
            </h3>
          </div>
        </div>

        <!-- Форма -->
        <UForm class="space-y-5">
          <!-- Заголовок -->
          <UFormField label="Заголовок" required class="space-y-1.5">
            <UInput
              v-model="newNotification.title"
              placeholder="Например: Технические работы"
              icon="i-heroicons-pencil-square"
              size="sm"
              class="w-full"
            />
          </UFormField>

          <!-- Описание -->
          <UFormField label="Описание" class="space-y-1.5">
            <UTextarea
              v-model="newNotification.description"
              placeholder="Опишите детали уведомления"
              :rows="3"
              size="sm"
              class="w-full"
            />
          </UFormField>

          <!-- Тип уведомления -->
          <UFormField label="Тип уведомления" required class="space-y-2">
            <URadioGroup
              v-model="newNotification.type"
              :color="newNotification.type"
              :items="notificationTypes"
              variant="card"
            >
              <template #label="{ item }">
                <div class="checked:text-success flex items-center gap-2">
                  <Icon class="text-xl" :name="item.icon" />
                  <span>{{ item.label }}</span>
                </div>
              </template>
            </URadioGroup>
          </UFormField>

          <!-- Время показа -->
          <div class="space-y-3">
            <h4
              class="text-xs font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1.5"
            >
              <UIcon name="i-heroicons-clock" class="w-3.5 h-3.5" />
              Время показа
            </h4>

            <div class="space-y-3">
              <!-- Время начала -->
              <UFormField label="Начало" required class="space-y-1">
                <UPopover>
                  <UButton
                    color="neutral"
                    variant="subtle"
                    icon="i-lucide-calendar"
                  >
                    {{
                      startTime
                        ? df.format(startTime.toDate(getLocalTimeZone()))
                        : 'Select a date'
                    }}
                  </UButton>

                  <template #content>
                    <UCalendar v-model="startTime" class="p-2" />
                  </template>
                </UPopover>
              </UFormField>

              <!-- Время окончания -->
              <UFormField label="Окончание" required class="space-y-1">
                <UInput
                  type="datetime-local"
                  icon="i-heroicons-calendar"
                  size="sm"
                  class="w-full"
                />
              </UFormField>
            </div>
          </div>
        </UForm>

        <!-- Footer -->
        <div
          class="flex items-center justify-end gap-2 px-5 py-4 border-t border-gray-100 dark:bg-gray-800/50"
        >
          <UButton color="neutral" variant="ghost" size="sm"> Отмена </UButton>
          <UButton color="primary" size="sm" class="min-w-[100px]">
            <span class="flex items-center gap-1.5">
              <UIcon name="i-heroicons-check-16-solid" class="w-3.5 h-3.5" />
              Создать
            </span>
          </UButton>
        </div>
      </div>
    </template>
  </UModal>
</template>

<style scoped></style>
