<script setup lang="ts">
import { useTagApi } from '~~/services/api/tag.api';
import type { Tag } from '~~/services/types/tag.type';

const emit = defineEmits(['update:modelValue']);
const props = defineProps<{
  modelValue: string[];
}>();

const toast = useToast();
const tagApi = useTagApi();

const tags = ref();
const tagsArr = ref(props.modelValue);

const { data } = await tagApi.getAllTags();
tags.value = data;

const onCreate = async (tagName: string) => {
  const tag = (await tagApi.createTag({ title: tagName })) as Tag;
  toast.add({ title: 'Тэг добавлен' });
  tagsArr.value.push(tag.id);
  tags.value.push(tag);
};
</script>

<template>
  <USelectMenu
    v-model="tagsArr"
    :items="tags"
    multiple
    label-key="title"
    value-key="id"
    placeholder="Выбрать тэги"
    class="w-full"
    create-item
    @update:model-value="emit('update:modelValue', tagsArr)"
    @create="onCreate"
  />
</template>

<style scoped></style>
