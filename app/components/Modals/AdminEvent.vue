<script setup lang="ts">
import { useEventApi } from '~~/services/api/event.api';
import type { IEvent } from '~~/services/types/event.type';
import { EVENT_PLACES } from '~/constants/places';
import { EVENT_PHONES } from '~/constants/phone';

const props = defineProps<{
  event?: IEvent;
}>();

const emit = defineEmits(['close', 'saved']);

const toast = useToast();
const eventApi = useEventApi();
const isUpdate = !!props.event;

const newEvent = ref<Partial<IEvent>>({
  title: '',
  content: '',
  phone: '',
  age: 18,
  place: '',
  isDeleted: false,
  eventTime: new Date().toISOString(),
  ...props.event,
});

if (isUpdate) {
  newEvent.value.eventTime = newEvent.value.eventTime?.slice(0, 16);
}

const handleSubmit = async () => {
  newEvent.value.eventTime = newEvent.value.eventTime + ':00.000Z';
  if (isUpdate) {
    await eventApi.updateEvent(props.event.id, newEvent.value);
  } else {
    await eventApi.createEvent(newEvent.value);
  }

  toast.add({
    title: isUpdate ? 'Событие обновлено' : 'Событие создано',
  });
  emit('close');
};

const handleCancel = () => {
  emit('close');
};
</script>

<template>
  <UModal :dismissible="false" title="события" description="События">
    <template #content>
      <div class="p-6">
        Заголовок
        <div class="mb-6">
          <h1 class="text-2xl font-bold text-gray-900">
            {{ isUpdate ? 'Обновлени события' : 'Создание события' }}
          </h1>
          <p class="text-gray-600 mt-1 text-sm">
            Заполните информацию о новом событии
          </p>
        </div>

        <!-- Форма -->
        <div class="space-y-6">
          <!-- Основная информация -->
          <div class="space-y-4">
            <UFormField label="Название события" required>
              <UInput
                v-model="newEvent.title"
                class="w-full"
                placeholder="Введите название события"
                icon="i-heroicons-tag"
                size="lg"
              />
            </UFormField>

            <UFormField label="Описание события" required>
              <rich-editor v-model="newEvent.content" />
            </UFormField>
          </div>

          <!-- Контактная информация и место -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <UFormField label="Контактный телефон" required>
              <USelect
                v-model="newEvent.phone"
                :items="EVENT_PHONES"
                placeholder="+7 (XXX) XXX-XX-XX"
                icon="i-heroicons-phone"
              />
            </UFormField>

            <UFormField label="Возрастное ограничение" required>
              <UInput
                v-model="newEvent.age"
                type="number"
                placeholder="18"
                min="0"
                max="100"
                icon="i-heroicons-user"
              />
            </UFormField>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <UFormField label="Место проведения" required>
              <USelect
                v-model="newEvent.place"
                :items="EVENT_PLACES"
                value-key="key"
                label-key="value"
                placeholder="Укажите место проведения"
                class="w-full"
              />
            </UFormField>

            <UFormField label="Дата публикации" class="m-0">
              <UInput
                v-model="newEvent.eventTime"
                type="datetime-local"
                class="w-full"
              />
            </UFormField>
          </div>

          <!-- Настройки -->
          <div class="p-4 bg-gray-50 rounded-lg border border-gray-200">
            <UFormField label="Статус события">
              <div class="flex items-center justify-between">
                <div class="space-y-1">
                  <p class="text-sm font-medium text-gray-900">
                    {{ newEvent.isDeleted ? 'Скрыто' : 'Активно' }}
                  </p>
                  <p class="text-xs text-gray-500">
                    {{
                      newEvent.isDeleted
                        ? 'Событие скрыто от пользователей'
                        : 'Событие видно всем пользователям'
                    }}
                  </p>
                </div>
                <USwitch
                  v-model="newEvent.isDeleted"
                  :label="newEvent.isDeleted ? 'Скрыто' : 'Активно'"
                />
              </div>
            </UFormField>
          </div>

          <!-- Кнопки действий -->
          <div
            class="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200"
          >
            <UButton
              variant="outline"
              color="gray"
              class="flex-1"
              @click="handleCancel"
            >
              Отмена
            </UButton>
            <UButton color="primary" class="flex-1" @click="handleSubmit">
              {{ isUpdate ? 'Обновить событие' : 'Создать событие' }}
            </UButton>
          </div>
        </div>
      </div>
    </template>
  </UModal>
</template>
