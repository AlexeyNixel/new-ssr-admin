<script setup lang="ts">
import { CalendarDate } from '@internationalized/date';
import { useLibraryExhibitionApi } from '~~/services/api/library-exhibition.api';
import type { LibraryExhibition } from '~~/services/types/library-exhibition.type';

const props = defineProps<{ exhibition?: LibraryExhibition }>();
const emit = defineEmits<{ close: [boolean] }>();

const toast = useToast();
const libraryExhibitionApi = useLibraryExhibitionApi();

const { entity: exhibition, pending, notFound } = useModalEntity({
  prop: props.exhibition,
  fetchById: (id) => libraryExhibitionApi.getOne(id),
});
const isUpdate = computed(() => !!exhibition.value);

const form = ref({ title: '', description: '' });
const startsAt = shallowRef<CalendarDate>();
const endsAt = shallowRef<CalendarDate>();
const errors = reactive<{ title?: string; description?: string; startsAt?: string; endsAt?: string }>({});
const startOpen = ref(false);
const endOpen = ref(false);
const saving = ref(false);

const pad = (value: number) => String(value).padStart(2, '0');

/*
 * Даты выставки хранятся «наивно» в UTC-нотации (как время событий,
 * см. AGENTS.md): день берём прямо из ISO-строки, без перевода поясов.
 */
const isoDay = (value: string | Date) =>
  (value instanceof Date ? value.toISOString() : String(value)).slice(0, 10);

const toCalendarDate = (value: string | Date) => {
  const [year, month, day] = isoDay(value).split('-').map(Number);
  return new CalendarDate(year || 1970, month || 1, day || 1);
};

/** Выбранный день → ISO-строка на UTC-полночь, чтобы день не «съезжал» между поясами */
const toIsoString = (date: CalendarDate) =>
  new Date(Date.UTC(date.year, date.month - 1, date.day)).toISOString();

const formatDay = (date?: CalendarDate | null) =>
  date ? `${pad(date.day)}.${pad(date.month)}.${date.year}` : 'Выберите дату';

watch(
  exhibition,
  (value) => {
    if (!value) return;
    form.value = {
      title: value.title ?? '',
      description: value.description ?? '',
    };
    if (value.startsAt) startsAt.value = toCalendarDate(value.startsAt);
    if (value.endsAt) endsAt.value = toCalendarDate(value.endsAt);
  },
  { immediate: true }
);

const onSubmit = async () => {
  errors.title = undefined;
  errors.description = undefined;
  errors.startsAt = undefined;
  errors.endsAt = undefined;

  const title = form.value.title.trim();
  const description = form.value.description.trim();

  if (!title) errors.title = 'Укажите название';
  else if (title.length > 300) errors.title = 'Не длиннее 300 символов';
  if (description.length > 1000) errors.description = 'Не длиннее 1000 символов';
  if (!startsAt.value) errors.startsAt = 'Выберите дату начала';
  if (!endsAt.value) errors.endsAt = 'Выберите дату окончания';

  const start = startsAt.value;
  const end = endsAt.value;
  if (start && end && toIsoString(end) < toIsoString(start)) {
    errors.endsAt = 'Дата окончания не может быть раньше даты начала';
  }

  if (!title || !start || !end || Object.values(errors).some(Boolean)) return;

  saving.value = true;
  try {
    const payload = {
      title,
      description: description || null,
      startsAt: toIsoString(start),
      endsAt: toIsoString(end),
    };
    if (isUpdate.value && exhibition.value) {
      await libraryExhibitionApi.update(exhibition.value.id, payload);
      toast.add({ title: 'Выставка обновлена', color: 'success' });
    } else {
      await libraryExhibitionApi.create(payload);
      toast.add({ title: 'Выставка создана', color: 'success' });
    }
    emit('close', true);
  } catch {
    toast.add({ title: 'Не удалось сохранить выставку', color: 'error' });
  } finally {
    saving.value = false;
  }
};
</script>

<template>
  <UModal
    :title="isUpdate ? 'Редактирование выставки' : 'Новая выставка в календаре'"
    :description="
      isUpdate
        ? 'Измените анонс физической выставки в календаре на главной'
        : 'Анонс физической выставки в библиотеке: название, описание и период показа'
    "
    :dismissible="false"
  >
    <template #body>
      <div v-if="pending" class="flex items-center justify-center py-12">
        <UIcon name="i-heroicons-arrow-path" class="w-6 h-6 animate-spin text-neutral-400" />
      </div>

      <div v-else-if="notFound" class="py-12 text-center text-neutral-500 dark:text-neutral-400">
        Запись не найдена
      </div>

      <div v-else class="flex w-full flex-col">
        <UForm :state="form" class="space-y-5" @submit="onSubmit">
          <UFormField
            required
            name="title"
            label="Название"
            :error="errors.title"
            help="Показывается в календаре на главной"
          >
            <UInput
              v-model="form.title"
              class="w-full"
              size="md"
              maxlength="300"
              placeholder="Например: Выставка картин «Времена года»"
              icon="i-lucide-gallery-horizontal"
            />
          </UFormField>

          <UFormField
            name="description"
            label="Описание"
            :error="errors.description"
            help="Необязательно. Пара строк пояснения в списке дня"
          >
            <UTextarea
              v-model="form.description"
              class="w-full"
              size="md"
              :rows="3"
              maxlength="1000"
              placeholder="Что можно увидеть на выставке"
            />
          </UFormField>

          <div class="grid gap-4 sm:grid-cols-2">
            <UFormField required name="startsAt" label="Дата начала" :error="errors.startsAt">
              <UPopover v-model:open="startOpen" class="w-full">
                <UButton color="neutral" variant="subtle" icon="i-lucide-calendar" class="w-full justify-start">
                  {{ formatDay(startsAt) }}
                </UButton>

                <template #content>
                  <UCalendar
                    v-model="startsAt"
                    class="p-2"
                    @update:model-value="startOpen = false"
                  />
                </template>
              </UPopover>
            </UFormField>

            <UFormField
              required
              name="endsAt"
              label="Дата окончания"
              :error="errors.endsAt"
              help="Последний день показа включительно"
            >
              <UPopover v-model:open="endOpen" class="w-full">
                <UButton color="neutral" variant="subtle" icon="i-lucide-calendar-range" class="w-full justify-start">
                  {{ formatDay(endsAt) }}
                </UButton>

                <template #content>
                  <UCalendar
                    v-model="endsAt"
                    :min-value="startsAt"
                    class="p-2"
                    @update:model-value="endOpen = false"
                  />
                </template>
              </UPopover>
            </UFormField>
          </div>

          <div class="mt-2 flex items-center justify-end gap-3 border-t border-default pt-4">
            <UButton color="neutral" variant="ghost" @click="emit('close', false)">Отмена</UButton>
            <UButton
              type="submit"
              color="primary"
              size="md"
              class="min-w-[140px]"
              :loading="saving"
              :icon="isUpdate ? 'i-lucide-check' : 'i-lucide-plus'"
            >
              {{ isUpdate ? 'Сохранить' : 'Создать' }}
            </UButton>
          </div>
        </UForm>
      </div>
    </template>
  </UModal>
</template>
