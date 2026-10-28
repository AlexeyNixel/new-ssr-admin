<script setup lang="ts">
import { computed, ref } from 'vue';
import { useTagApi } from '~~/services/api/tag.api';
import type { Tag } from '~~/services/types/tag.type';
import { findPlacement } from '~~/services/ai/postTags';

const props = withDefaults(
  defineProps<{
    /** Текст новости (заголовок + содержимое без HTML), по которому подбираем теги. */
    source: string;
    /** Уже выбранные теги (их id). */
    modelValue: string[];
    /** Дата публикации, YYYY-MM-DD — помогает отличить анонс от прошедшего события. */
    publishedDate?: string;
    /** Дата мероприятия, YYYY-MM-DD. */
    eventDate?: string;
    minLength?: number;
  }>(),
  { minLength: 40 }
);

const emit = defineEmits<{ 'update:modelValue': [ids: string[]] }>();

type Status = 'idle' | 'loading' | 'done' | 'error';

const toast = useToast();
const tagApi = useTagApi();

const allTags = ref<Tag[]>([]);
const placementId = ref<string | null>(null);
const rankedIds = ref<string[]>([]);
// Темы (эмбеддинги) приходят за секунду, размещение (чат-модель) — заметно дольше,
// поэтому у секций независимые статусы
const placementStatus = ref<Status>('idle');
const themesStatus = ref<Status>('idle');

const enabled = computed(() => props.source.trim().length >= props.minLength);
const busy = computed(() => placementStatus.value === 'loading' || themesStatus.value === 'loading');
const byId = (id: string) => allTags.value.find((t) => t.id === id);

// Теги размещения, которые редактор уже выбрал (по правилам фронта должен быть один)
const selectedPlacements = computed(() =>
  allTags.value.filter((t) => props.modelValue.includes(t.id) && findPlacement(t))
);

const placementTag = computed(() => (placementId.value ? byId(placementId.value) : undefined));
const placementHint = computed(() => (placementTag.value ? findPlacement(placementTag.value)?.hint : ''));
const placementApplied = computed(
  () =>
    !!placementTag.value &&
    selectedPlacements.value.length === 1 &&
    selectedPlacements.value[0]!.id === placementId.value
);
const placementConflicts = computed(() =>
  selectedPlacements.value.filter((t) => t.id !== placementId.value)
);

// Тематические подсказки в порядке соответствия, без уже выбранных
const suggestions = computed(() =>
  rankedIds.value.map(byId).filter((t): t is Tag => !!t && !props.modelValue.includes(t.id))
);

const loadTags = async () => {
  if (allTags.value.length) return;
  const { data } = await tagApi.getAllTags({ limit: 100 });
  allTags.value = (data ?? []) as Tag[];
};

const suggest = async () => {
  if (!enabled.value) {
    toast.add({ title: 'Сначала заполните текст новости', color: 'warning' });
    return;
  }
  try {
    await loadTags();
  } catch {
    toast.add({ title: 'Не удалось загрузить список тегов', color: 'error' });
    return;
  }

  const body = {
    text: props.source,
    tags: allTags.value.map(({ id, title }) => ({ id, title })),
    publishedDate: props.publishedDate,
    eventDate: props.eventDate,
  };

  themesStatus.value = 'loading';
  placementStatus.value = 'loading';

  await Promise.all([
    $fetch<{ tags: string[] }>('/api/ai/tags/themes', { method: 'POST', body })
      .then((res) => {
        rankedIds.value = res.tags;
        themesStatus.value = 'done';
      })
      .catch(() => (themesStatus.value = 'error')),
    $fetch<{ placement: string | null }>('/api/ai/tags/placement', { method: 'POST', body })
      .then((res) => {
        placementId.value = res.placement;
        placementStatus.value = 'done';
      })
      .catch(() => (placementStatus.value = 'error')),
  ]);
};

// Тег размещения ставим вместо остальных: два сразу — ошибка, новость уйдёт в один блок
const applyPlacement = () => {
  if (!placementId.value) return;
  const rest = props.modelValue.filter((id) => !selectedPlacements.value.some((t) => t.id === id));
  emit('update:modelValue', [...rest, placementId.value]);
};

const add = (tag: Tag) => emit('update:modelValue', [...props.modelValue, tag.id]);

const addAll = () =>
  emit('update:modelValue', [...props.modelValue, ...suggestions.value.map((t) => t.id)]);
</script>

<template>
  <div class="space-y-3">
    <p v-if="selectedPlacements.length > 1" class="text-xs text-warning">
      Выбрано несколько тегов размещения
      ({{ selectedPlacements.map((t) => `«${t.title}»`).join(', ') }}) — на главной новость попадёт
      только в один блок. Оставьте один.
    </p>

    <UButton
      icon="i-lucide-sparkles"
      color="primary"
      variant="ghost"
      size="xs"
      :loading="busy"
      :disabled="!enabled || busy"
      @click="suggest"
    >
      Подобрать теги
    </UButton>

    <!-- Темы -->
    <div v-if="themesStatus !== 'idle'" class="space-y-1.5">
      <div class="flex items-center justify-between gap-2">
        <span class="text-xs font-medium text-muted">Темы — по убыванию соответствия</span>
        <UButton
          v-if="themesStatus === 'done' && suggestions.length > 1"
          color="neutral"
          variant="ghost"
          size="xs"
          @click="addAll"
        >
          Добавить все
        </UButton>
      </div>
      <p v-if="themesStatus === 'loading'" class="flex items-center gap-1.5 text-xs text-muted">
        <UIcon name="i-lucide-loader-circle" class="size-3.5 animate-spin" /> Подбираем темы…
      </p>
      <p v-else-if="themesStatus === 'error'" class="text-xs text-error">
        Не удалось подобрать темы
      </p>
      <div v-else-if="suggestions.length" class="flex flex-wrap gap-1.5">
        <UButton
          v-for="(tag, index) in suggestions"
          :key="tag.id"
          :color="index === 0 ? 'primary' : 'neutral'"
          :variant="index === 0 ? 'soft' : 'outline'"
          size="xs"
          trailing-icon="i-lucide-plus"
          @click="add(tag)"
        >
          {{ tag.title }}
        </UButton>
      </div>
      <p v-else class="text-xs text-muted">
        {{ rankedIds.length ? 'Все подходящие темы уже выбраны.' : 'Подходящих тематических тегов не нашлось.' }}
      </p>
    </div>

    <!-- Размещение на главной -->
    <div v-if="placementStatus !== 'idle'" class="space-y-1.5">
      <div class="text-xs font-medium text-muted">Размещение на главной</div>
      <p v-if="placementStatus === 'loading'" class="flex items-center gap-1.5 text-xs text-muted">
        <UIcon name="i-lucide-loader-circle" class="size-3.5 animate-spin" /> Определяем блок…
      </p>
      <p v-else-if="placementStatus === 'error'" class="text-xs text-error">
        Не удалось определить блок
      </p>
      <template v-else-if="placementTag">
        <div class="flex flex-wrap items-center gap-2">
          <UButton
            :color="placementApplied ? 'primary' : 'neutral'"
            :variant="placementApplied ? 'soft' : 'outline'"
            size="xs"
            :icon="placementApplied ? 'i-lucide-check' : undefined"
            :trailing-icon="placementApplied ? undefined : 'i-lucide-plus'"
            :disabled="placementApplied"
            @click="applyPlacement"
          >
            {{ placementTag.title }}
          </UButton>
          <span class="text-xs text-muted">{{ placementHint }}</span>
        </div>
        <p v-if="placementConflicts.length && !placementApplied" class="text-xs text-warning">
          Заменит {{ placementConflicts.map((t) => `«${t.title}»`).join(', ') }}
        </p>
      </template>
      <p v-else class="text-xs text-muted">Блок не определён — выберите вручную.</p>
    </div>
  </div>
</template>
