<script setup lang="ts">
import type { FormErrorEvent } from '@nuxt/ui';
import { CalendarDate, Time, getLocalTimeZone, today } from '@internationalized/date';
import { useEventApi } from '~~/services/api/event.api';
import type { EventCategory, IEvent } from '~~/services/types/event.type';
import { EVENT_PLACES } from '~/constants/places';
import { EVENT_CATEGORIES, suggestEventCategory } from '~/constants/eventCategories';
import { EVENT_PHONES } from '~/constants/phone';
import { eventSchema } from '~/schemas/event.schema';
import { htmlToText } from '~/schemas/post.schema';
import EditorCustom from '~/components/Editor/EditorCustom.vue';

const route = useRoute();
const eventId = route.params.id as string | undefined;
const isUpdate = !!eventId;

const toast = useToast();
const eventApi = useEventApi();

const form = reactive({
  title: '',
  content: '',
  phone: undefined as string | undefined,
  age: 12 as number | null,
  place: undefined as string | undefined,
  category: undefined as EventCategory | undefined,
  isDeleted: false,
});

/*
 * Время события хранится «как есть» в UTC-нотации: 15:00 в городе
 * сохраняется как ...T15:00:00.000Z и так же выводится (dayjs.utc()).
 * Поэтому дату и время берём из строки напрямую, без перевода поясов.
 */
// shallowRef: у классов @internationalized/date приватные поля, ref их «разворачивает»
const eventDate = shallowRef<CalendarDate>(today(getLocalTimeZone()));
const eventTime = shallowRef<Time>(new Time(12, 0));

const parseEventTime = (value: string) => {
  const [date = '', time = ''] = value.split('T');
  const [year, month, day] = date.split('-').map(Number);
  const [hour, minute] = time.split(':').map(Number);
  if (year && month && day) eventDate.value = new CalendarDate(year, month, day);
  if (hour != null && minute != null && !Number.isNaN(hour)) eventTime.value = new Time(hour, minute);
};

const pad = (value: number) => String(value).padStart(2, '0');
const toEventTime = (date: CalendarDate) =>
  `${date.toString()}T${pad(eventTime.value.hour)}:${pad(eventTime.value.minute)}:00.000Z`;

const loaded = ref<IEvent>();
const loadError = ref(false);

// «Дублировать»: /event/admin?copyFrom=<id> — новое событие, заполненное копией
const copyFromId = isUpdate ? undefined : (route.query.copyFrom as string | undefined);
const copiedFrom = ref<IEvent>();

const sourceId = eventId ?? copyFromId;
if (sourceId) {
  try {
    const data = await eventApi.getOneEvent(sourceId);
    if (isUpdate) loaded.value = data;
    else copiedFrom.value = data;
    Object.assign(form, {
      title: data.title ?? '',
      content: data.content ?? '',
      phone: data.phone || undefined,
      age: data.age ?? null,
      place: data.place || undefined,
      category: data.category ?? undefined,
      // копия создаётся видимой, даже если оригинал скрыт
      isDeleted: isUpdate ? !!data.isDeleted : false,
    });
    if (data.eventTime) parseEventTime(data.eventTime);
  } catch {
    if (isUpdate) loadError.value = true;
    else toast.add({ title: 'Не удалось загрузить событие для копии', color: 'error' });
  }
}

// Если телефон/место у старого события не из справочника — всё равно показываем его
const phoneItems = computed(() =>
  form.phone && !EVENT_PHONES.includes(form.phone) ? [form.phone, ...EVENT_PHONES] : EVENT_PHONES
);
const placeItems = computed(() =>
  form.place && !EVENT_PLACES.some((place) => place.key === form.place)
    ? [{ key: form.place, value: form.place }, ...EVENT_PLACES]
    : EVENT_PLACES
);

// Подсказка типа по названию — пока редактор сам не выбрал тип
const suggestedCategory = computed(() => {
  if (form.category) return undefined;
  const value = suggestEventCategory(form.title);
  return EVENT_CATEGORIES.find((item) => item.value === value);
});

// ---------- Несколько дней (только при создании) ----------

const isRange = ref(false);
const rangeEnd = shallowRef<CalendarDate>();

const rangeDays = computed(() => {
  if (!isRange.value || !rangeEnd.value) return 1;
  const diff = rangeEnd.value.compare(eventDate.value);
  return diff > 0 ? diff + 1 : 1;
});

watch(isRange, (value) => {
  rangeEnd.value = value ? eventDate.value.add({ days: 1 }) : undefined;
});

// Дата окончания не может быть раньше даты начала
watch(eventDate, (value) => {
  if (rangeEnd.value && rangeEnd.value.compare(value) <= 0) rangeEnd.value = value.add({ days: 1 });
});

// ---------- Форма ----------

const formRef = useTemplateRef('formRef');

const { isDirty, markSaved, onError } = useEntityForm({
  snapshot: () => ({
    ...form,
    date: eventDate.value.toString(),
    time: eventTime.value.toString(),
    range: rangeEnd.value?.toString(),
  }),
  submit: () => formRef.value?.submit(),
  fieldLabels: {
    title: 'Название',
    content: 'Описание',
    phone: 'Телефон',
    age: 'Возрастное ограничение',
    place: 'Место проведения',
    category: 'Тип события',
  },
});

const status = computed(() =>
  publicationStatus(isUpdate, form.isDeleted, { shown: 'Активно', hidden: 'Скрыто', created: 'Новое' })
);

const dateFormatter = new Intl.DateTimeFormat('ru-RU', {
  weekday: 'short',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});
const formatDate = (date: CalendarDate) => dateFormatter.format(date.toDate('UTC'));

const isPast = computed(() => eventDate.value.compare(today(getLocalTimeZone())) < 0);

/** «вт, 21 октября 2026 г., 18:30» — из «наивной» строки eventTime */
const formatEventTime = (value: string) => {
  const [date = '', time = ''] = value.split('T');
  const [year, month, day] = date.split('-').map(Number);
  return `${formatDate(new CalendarDate(year!, month!, day!))}, ${time.slice(0, 5)}`;
};

// ---------- Созданные без ухода со страницы ----------

// Одинаковые события на разные дни: создал — поменял дату — создал ещё
const createdHere = ref<{ id: string; eventTime: string }[]>([]);
const createdTimes = computed(() => new Set(createdHere.value.map((item) => item.eventTime)));
const alreadyCreated = computed(() => createdTimes.value.has(toEventTime(eventDate.value)));

const dateHelp = computed(() => {
  if (alreadyCreated.value) return 'На эту дату и время событие уже создано — выберите другую';
  return isPast.value ? 'Дата в прошлом' : undefined;
});

const dateOpen = ref(false);
const rangeOpen = ref(false);

const checklist = computed(() => [
  { label: 'Название', done: form.title.trim().length > 0 },
  { label: 'Описание', done: htmlToText(form.content).length > 0 },
  { label: 'Тип события', done: !!form.category },
  { label: 'Место проведения', done: !!form.place },
  { label: 'Телефон', done: !!form.phone },
  { label: 'Возрастное ограничение', done: form.age != null },
]);

// ---------- Сохранение ----------

const saving = ref(false);
const stayAfterCreate = ref(false);

const submitAndStay = () => {
  stayAfterCreate.value = true;
  formRef.value?.submit();
};

const onValidationError = (event: FormErrorEvent) => {
  stayAfterCreate.value = false;
  onError(event);
};

const onSubmit = async () => {
  const stay = stayAfterCreate.value;
  stayAfterCreate.value = false;
  if (saving.value) return;

  const times = isUpdate
    ? []
    : Array.from({ length: rangeDays.value }, (_, i) => toEventTime(eventDate.value.add({ days: i })));
  const repeats = times.filter((time) => createdTimes.value.has(time));
  if (
    repeats.length &&
    !window.confirm(`На ${repeats.map(formatEventTime).join('; ')} событие уже создано. Создать ещё одно такое же?`)
  ) {
    return;
  }

  saving.value = true;

  const payload: Partial<IEvent> = {
    ...form,
    title: form.title.trim(),
    age: form.age ?? 0,
  };

  try {
    if (isUpdate) {
      await eventApi.updateEvent(eventId!, { ...payload, eventTime: toEventTime(eventDate.value) });
      toast.add({ title: 'Событие обновлено', color: 'success', icon: 'i-lucide-circle-check' });
    } else {
      for (const eventTime of times) {
        const created = (await eventApi.createEvent({ ...payload, eventTime })) as IEvent;
        createdHere.value.push({ id: created.id, eventTime });
      }
      toast.add({
        title: times.length > 1 ? `Создано ${pluralEvents(times.length)}` : 'Событие создано',
        description: stay ? 'Поменяйте дату и создайте следующее' : undefined,
        color: 'success',
        icon: 'i-lucide-circle-check',
      });
    }
    markSaved();
    if (stay) {
      // форма остаётся заполненной — сразу предлагаем выбрать новую дату
      dateOpen.value = true;
      return;
    }
    await navigateTo('/event');
  } catch {
    toast.add({
      title: 'Не удалось сохранить событие',
      description: 'Проверьте соединение и попробуйте ещё раз',
      color: 'error',
    });
  } finally {
    saving.value = false;
  }
};

// 1 событие, 2 события, 5 событий
const pluralEvents = (count: number) => {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 === 1 && mod100 !== 11) return `${count} событие`;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return `${count} события`;
  return `${count} событий`;
};

const submitLabel = computed(() => {
  if (isUpdate) return 'Сохранить';
  return rangeDays.value > 1 ? `Создать ${pluralEvents(rangeDays.value)}` : 'Создать событие';
});

useHead({ title: isUpdate ? 'НОМБ | Редактирование события' : 'НОМБ | Новое событие' });
</script>

<template>
  <div class="min-h-screen bg-muted [--editor-toolbar-top:4rem]">
    <EntityFormNotFound
      v-if="loadError"
      title="Событие не найдено"
      back-to="/event"
      back-label="К списку событий"
    />

    <UForm
      v-else
      ref="formRef"
      :schema="eventSchema"
      :state="form"
      @submit="onSubmit"
      @error="onValidationError"
    >
      <EntityFormHeader
        back-to="/event"
        back-label="К списку событий"
        section="События"
        :title="isUpdate ? form.title || 'Редактирование события' : 'Новое событие'"
        :status="status"
        :is-dirty="isDirty"
        :saving="saving"
        :submit-label="submitLabel"
      >
        <template #actions>
          <UTooltip v-if="!isUpdate" text="Сохранить и оставить форму заполненной — останется поменять дату">
            <UButton
              icon="i-lucide-copy-plus"
              color="neutral"
              variant="outline"
              :disabled="saving"
              @click="submitAndStay"
            >
              <span class="hidden sm:inline">Создать и остаться</span>
            </UButton>
          </UTooltip>
          <UTooltip v-else text="Новое событие с теми же данными — останется выбрать дату">
            <UButton
              :to="`/event/admin?copyFrom=${eventId}`"
              icon="i-lucide-copy"
              color="neutral"
              variant="outline"
            >
              <span class="hidden sm:inline">Дублировать</span>
            </UButton>
          </UTooltip>
        </template>
      </EntityFormHeader>

      <EntityFormBody>
        <UAlert
          v-if="copiedFrom"
          color="info"
          variant="subtle"
          icon="i-lucide-copy"
          :title="`Копия события «${copiedFrom.title}»`"
          :description="`Оригинал — ${formatEventTime(copiedFrom.eventTime)}. Поменяйте дату и время, остальное уже заполнено.`"
        />

        <section class="rounded-xl border border-default bg-default p-4 shadow-xs sm:p-6">
          <EntityFormTitleInput v-model="form.title" placeholder="Название события" />
        </section>

        <UFormField
          name="content"
          data-field="content"
          label="Описание события"
          required
          :ui="{ label: 'text-base font-semibold', container: 'mt-2' }"
        >
          <EditorCustom v-model="form.content" />
        </UFormField>

        <template #aside>
          <EntityFormCard title="Публикация" icon="i-lucide-send">
            <EntityFormPublishSwitch
              v-model="form.isDeleted"
              shown-text="Событие видно в афише"
              hidden-text="Событие скрыто от посетителей"
            />
          </EntityFormCard>

          <EntityFormCard title="Когда" icon="i-lucide-calendar-clock">
            <div class="grid grid-cols-[minmax(0,1fr)_7rem] gap-3">
              <UFormField
                :label="isRange ? 'Первый день' : 'Дата'"
                :help="dateHelp"
                :ui="{ help: alreadyCreated ? 'text-warning' : undefined }"
              >
                <UPopover v-model:open="dateOpen">
                  <UButton
                    color="neutral"
                    variant="outline"
                    icon="i-lucide-calendar"
                    class="w-full"
                    :ui="{ base: 'truncate' }"
                  >
                    <span class="truncate">{{ formatDate(eventDate) }}</span>
                  </UButton>
                  <template #content>
                    <div class="p-2">
                      <UCalendar
                        v-model="eventDate"
                        @update:model-value="dateOpen = false"
                      />
                    </div>
                  </template>
                </UPopover>
              </UFormField>

              <UFormField label="Время">
                <UInputTime v-model="eventTime" :hour-cycle="24" class="w-full" />
              </UFormField>
            </div>

            <template v-if="!isUpdate">
              <USwitch
                v-model="isRange"
                label="Несколько дней"
                description="Одинаковое событие создастся на каждый день диапазона"
              />

              <UFormField
                v-if="isRange && rangeEnd"
                label="Последний день"
                :help="`Будет создано событий: ${rangeDays}`"
              >
                <UPopover v-model:open="rangeOpen">
                  <UButton
                    color="neutral"
                    variant="outline"
                    icon="i-lucide-calendar-range"
                    class="w-full"
                  >
                    <span class="truncate">{{ formatDate(rangeEnd) }}</span>
                  </UButton>
                  <template #content>
                    <div class="p-2">
                      <UCalendar
                        v-model="rangeEnd"
                        :min-value="eventDate.add({ days: 1 })"
                        @update:model-value="rangeOpen = false"
                      />
                    </div>
                  </template>
                </UPopover>
              </UFormField>
            </template>
          </EntityFormCard>

          <EntityFormCard v-if="createdHere.length" title="Создано сейчас" icon="i-lucide-history">
            <template #trailing>
              <span class="tabular-nums text-muted">{{ createdHere.length }}</span>
            </template>
            <ul class="space-y-1 text-sm">
              <li v-for="item in createdHere" :key="item.id">
                <ULink
                  :to="`/event/admin/${item.id}`"
                  target="_blank"
                  class="flex items-center gap-2 text-default hover:text-primary"
                >
                  <UIcon name="i-lucide-circle-check" class="size-4 shrink-0 text-success" />
                  <span class="truncate">{{ formatEventTime(item.eventTime) }}</span>
                  <UIcon name="i-lucide-external-link" class="ms-auto size-3.5 shrink-0 text-dimmed" />
                </ULink>
              </li>
            </ul>
          </EntityFormCard>

          <EntityFormCard title="Тип события" icon="i-lucide-shapes">
            <UFormField
              name="category"
              data-field="category"
              label="Что это за событие"
              help="От типа зависят цвет плаката и фильтр в афише на сайте"
              required
            >
              <URadioGroup
                v-model="form.category"
                :items="EVENT_CATEGORIES"
                value-key="value"
                variant="card"
                indicator="hidden"
                class="w-full"
                :ui="{ fieldset: 'grid gap-2', item: 'py-2.5', wrapper: 'text-left', description: 'text-left' }"
              >
                <template #label="{ item }">
                  <span class="flex items-center gap-2">
                    <span
                      class="size-3.5 shrink-0 rounded-full ring-1 ring-black/15"
                      :style="{ backgroundColor: item.color }"
                    />
                    {{ item.label }}
                  </span>
                </template>
              </URadioGroup>
            </UFormField>

            <UButton
              v-if="suggestedCategory"
              color="neutral"
              variant="soft"
              size="sm"
              icon="i-lucide-wand-sparkles"
              class="self-start"
              @click="form.category = suggestedCategory.value"
            >
              По названию похоже на «{{ suggestedCategory.label }}»
            </UButton>
          </EntityFormCard>

          <EntityFormCard title="Где и для кого" icon="i-lucide-map-pin">
            <UFormField name="place" data-field="place" label="Место проведения" required>
              <USelectMenu
                v-model="form.place"
                :items="placeItems"
                value-key="key"
                label-key="value"
                placeholder="Выберите место"
                :search-input="{ placeholder: 'Поиск…' }"
                class="w-full"
              />
            </UFormField>

            <UFormField name="phone" data-field="phone" label="Телефон для справок" required>
              <USelect
                v-model="form.phone"
                :items="phoneItems"
                placeholder="Выберите телефон"
                icon="i-lucide-phone"
                class="w-full"
              />
            </UFormField>

            <UFormField name="age" data-field="age" label="Возрастное ограничение" required>
              <EntityFormAgeInput v-model="form.age" />
            </UFormField>
          </EntityFormCard>

          <EntityFormChecklist :items="checklist" />
        </template>
      </EntityFormBody>
    </UForm>
  </div>
</template>
