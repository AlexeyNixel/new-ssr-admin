<script setup lang="ts">
import { useEventApi } from '~~/services/api/event.api';
import type { IEvent } from '~~/services/types/event.type';
import { EVENT_PLACES } from '~/constants/places';
import { EVENT_PHONES } from '~/constants/phone';
import { eventSchema } from '~/schemas/event.schema';

const props = defineProps<{
  event?: IEvent;
}>();

const emit = defineEmits(['close', 'saved']);

const toast = useToast();
const eventApi = useEventApi();
const isUpdate = !!props.event;
const schema = eventSchema;

const newEvent = ref<Partial<IEvent>>({
  title: undefined,
  content: undefined,
  phone: undefined,
  age: 12,
  place: undefined,
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
</script>

<template>
  <UModal
    :title="isUpdate ? 'Редактирование события' : 'Создание события'"
    :description="
      isUpdate
        ? 'Внесите изменения в событие'
        : 'Заполните информацию о событии'
    "
    :dismissible="false"
  >
    <template #body>
      <div class="flex flex-col w-full">
        <UForm
          :schema="schema"
          :state="newEvent"
          class="space-y-5"
          @submit="handleSubmit"
        >
          <UFormField name="title" label="Название события" required>
            <UInput
              v-model="newEvent.title"
              class="w-full"
              placeholder="Введите название события"
              icon="i-heroicons-tag"
              size="md"
            />
          </UFormField>

          <UFormField name="content" label="Описание события" required>
            <EditorCustom v-model="newEvent.content" />
          </UFormField>
          <UFormField name="phone" label="Контактный телефон" required>
            <USelect
              v-model="newEvent.phone"
              :items="EVENT_PHONES"
              placeholder="+7 (XXX) XXX-XX-XX"
              icon="i-heroicons-phone"
              class="w-full"
            />
          </UFormField>

          <UFormField name="age" label="Возрастное ограничение" required>
            <UInput
              v-model="newEvent.age"
              type="number"
              placeholder="18"
              min="0"
              max="100"
              icon="i-heroicons-user"
              class="w-full"
            />
          </UFormField>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-5" />

          <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
            <UFormField name="place" label="Место проведения" required>
              <USelect
                v-model="newEvent.place"
                :items="EVENT_PLACES"
                value-key="key"
                label-key="value"
                placeholder="Укажите место проведения"
                class="w-full"
              />
            </UFormField>

            <UFormField name="eventTime" required label="Дата публикации">
              <UInput
                v-model="newEvent.eventTime"
                type="datetime-local"
                class="w-full"
              />
            </UFormField>
          </div>

          <UFormField label="Статус события">
            <div
              class="p-4 bg-neutral-50 dark:bg-neutral-800/50 rounded-xl border border-neutral-200 dark:border-neutral-700"
            >
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <UIcon
                    :name="
                      newEvent.isDeleted
                        ? 'i-heroicons-eye-slash-20-solid'
                        : 'i-heroicons-eye-20-solid'
                    "
                    class="w-4 h-4"
                    :class="
                      newEvent.isDeleted ? 'text-neutral-500' : 'text-green-500'
                    "
                  />
                  <p
                    class="text-sm font-medium text-neutral-900 dark:text-white"
                  >
                    {{
                      newEvent.isDeleted ? 'Событие скрыто' : 'Событие активно'
                    }}
                  </p>
                </div>
                <USwitch v-model="newEvent.isDeleted" />
              </div>
            </div>
            <p class="text-xs text-neutral-500 dark:text-neutral-400">
              {{
                newEvent.isDeleted
                  ? 'Событие не отображается пользователям'
                  : 'Событие видно всем пользователям'
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
              :icon="
                isUpdate
                  ? 'i-heroicons-pencil-square-20-solid'
                  : 'i-heroicons-plus-20-solid'
              "
            >
              {{ isUpdate ? 'Обновить событие' : 'Создать событие' }}
            </UButton>
          </div>
        </UForm>
      </div>
    </template>
  </UModal>
</template>
