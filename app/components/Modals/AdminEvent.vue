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
const isLoading = ref(false);
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

// --- Диапазон дат (только для создания) ---
const isRange = ref(false);
const rangeEndDate = ref('');

const startDateOnly = computed(() => newEvent.value.eventTime?.slice(0, 10) ?? '');

const rangeDaysCount = computed(() => {
  if (!isRange.value || !rangeEndDate.value || !startDateOnly.value) return 1;
  const start = new Date(startDateOnly.value);
  const end = new Date(rangeEndDate.value);
  const diff = Math.round((end.getTime() - start.getTime()) / 86_400_000);
  return diff > 0 ? diff + 1 : 1;
});

watch(isRange, (val) => {
  if (!val) rangeEndDate.value = '';
});

// Добавляет N дней к строке даты YYYY-MM-DD
function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

const handleSubmit = async () => {
  isLoading.value = true;
  try {
    if (isUpdate && props.event) {
      const payload = { ...newEvent.value, eventTime: newEvent.value.eventTime + ':00.000Z' };
      await eventApi.updateEvent(props.event.id, payload);
      toast.add({ title: 'Событие обновлено' });
      emit('close');
      return;
    }

    const timePart = newEvent.value.eventTime?.slice(11, 16) ?? '00:00';

    if (isRange.value && rangeEndDate.value && rangeDaysCount.value > 1) {
      for (let i = 0; i < rangeDaysCount.value; i++) {
        const dayStr = addDays(startDateOnly.value, i);
        await eventApi.createEvent({
          ...newEvent.value,
          eventTime: `${dayStr}T${timePart}:00.000Z`,
        });
      }
      toast.add({ title: `Создано ${rangeDaysCount.value} событий` });
    } else {
      await eventApi.createEvent({
        ...newEvent.value,
        eventTime: newEvent.value.eventTime + ':00.000Z',
      });
      toast.add({ title: 'Событие создано' });
    }

    emit('close');
  } finally {
    isLoading.value = false;
  }
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

            <UFormField name="eventTime" required label="Дата и время">
              <UInput
                v-model="newEvent.eventTime"
                type="datetime-local"
                class="w-full"
              />
            </UFormField>
          </div>

          <template v-if="!isUpdate">
            <div
              class="p-4 bg-neutral-50 dark:bg-neutral-800/50 rounded-xl border border-neutral-200 dark:border-neutral-700"
            >
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <UIcon
                    name="i-heroicons-calendar-days-20-solid"
                    class="w-4 h-4 text-primary-500"
                  />
                  <p class="text-sm font-medium text-neutral-900 dark:text-white">
                    Создать на несколько дней
                  </p>
                </div>
                <USwitch v-model="isRange" />
              </div>
              <p class="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                Одно и то же событие будет создано на каждый день диапазона
              </p>
            </div>

            <Transition name="fade">
              <UFormField v-if="isRange" label="Дата окончания" required>
                <UInput
                  v-model="rangeEndDate"
                  type="date"
                  :min="startDateOnly"
                  class="w-full"
                />
                <p
                  v-if="rangeDaysCount > 1"
                  class="text-xs text-primary-500 font-medium"
                >
                  Будет создано {{ rangeDaysCount }} событий
                </p>
                <p v-else class="text-xs text-neutral-500 dark:text-neutral-400">
                  Выберите дату позже даты начала
                </p>
              </UFormField>
            </Transition>
          </template>

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
              :loading="isLoading"
              :icon="
                isUpdate
                  ? 'i-heroicons-pencil-square-20-solid'
                  : 'i-heroicons-plus-20-solid'
              "
            >
              <template v-if="isUpdate">Обновить событие</template>
              <template v-else-if="isRange && rangeDaysCount > 1">
                Создать {{ rangeDaysCount }} событий
              </template>
              <template v-else>Создать событие</template>
            </UButton>
          </div>
        </UForm>
      </div>
    </template>
  </UModal>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
