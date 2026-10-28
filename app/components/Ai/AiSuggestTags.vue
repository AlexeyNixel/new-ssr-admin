<script setup lang="ts">
import { computed, ref } from 'vue';
import { useTagApi } from '~~/services/api/tag.api';
import type { Tag } from '~~/services/types/tag.type';
import { useAiClassify } from '~/composables/useAiClassify';

const props = withDefaults(
  defineProps<{
    /** Текст новости (заголовок + содержимое без HTML), по которому подбираем теги. */
    source: string;
    /** Уже выбранные теги (их id). */
    modelValue: string[];
    minLength?: number;
  }>(),
  { minLength: 40 }
);

const emit = defineEmits<{ 'update:modelValue': [ids: string[]] }>();

const toast = useToast();
const tagApi = useTagApi();
const { classify, loading } = useAiClassify();

const allTags = ref<Tag[]>([]);
const suggested = ref<Tag[]>([]);
const asked = ref(false);

const enabled = computed(() => props.source.trim().length >= props.minLength);

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
  await loadTags();
  asked.value = true;
  const titles = allTags.value.map((t) => t.title);
  const picked = await classify(props.source, titles, true);
  const pickedLower = picked.map((p) => p.toLowerCase());
  // Оставляем только ещё не выбранные теги
  suggested.value = allTags.value.filter(
    (t) => pickedLower.includes(t.title.toLowerCase()) && !props.modelValue.includes(t.id)
  );
};

const add = (tag: Tag) => {
  emit('update:modelValue', [...props.modelValue, tag.id]);
  suggested.value = suggested.value.filter((t) => t.id !== tag.id);
};

const addAll = () => {
  emit('update:modelValue', [...props.modelValue, ...suggested.value.map((t) => t.id)]);
  suggested.value = [];
};
</script>

<template>
  <div class="space-y-2">
    <div class="flex items-center gap-2">
      <UButton
        icon="i-lucide-sparkles"
        color="primary"
        variant="ghost"
        size="xs"
        :loading="loading"
        :disabled="!enabled || loading"
        @click="suggest"
      >
        Подобрать теги
      </UButton>
      <UButton
        v-if="suggested.length > 1"
        color="neutral"
        variant="ghost"
        size="xs"
        @click="addAll"
      >
        Добавить все
      </UButton>
    </div>

    <div v-if="suggested.length" class="flex flex-wrap gap-1.5">
      <UButton
        v-for="tag in suggested"
        :key="tag.id"
        color="neutral"
        variant="outline"
        size="xs"
        trailing-icon="i-lucide-plus"
        @click="add(tag)"
      >
        {{ tag.title }}
      </UButton>
    </div>
    <p v-else-if="asked && !loading" class="text-xs text-muted">
      Подходящих тегов не нашлось — выберите вручную.
    </p>
  </div>
</template>
