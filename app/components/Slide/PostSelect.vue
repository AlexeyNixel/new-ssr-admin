<script setup lang="ts">
import { usePostApi } from '~~/services/api/post.api';

/*
 * Выбор новости для слайда: поиск по названию на бэкенде.
 * v-model — id новости (как раньше вводили вручную).
 */
const postId = defineModel<string | undefined>({ default: undefined });

interface PostItem {
  id: string;
  title: string;
  description?: string;
}

const postApi = usePostApi();

const items = ref<PostItem[]>([]);
const searchTerm = ref('');
const loading = ref(false);

const toItem = (post: { id: string; title: string; publishedAt?: string }): PostItem => ({
  id: post.id,
  title: post.title,
  description: post.publishedAt ? new Date(post.publishedAt).toLocaleDateString('ru-RU') : undefined,
});

// Уже выбранная новость должна быть в списке, иначе селект покажет пустоту
const selected = ref<PostItem>();
if (postId.value) {
  try {
    const post = await postApi.getPostById(postId.value);
    selected.value = toItem(post);
  } catch {
    selected.value = { id: postId.value, title: `Новость не найдена (${postId.value})` };
  }
}

const search = async () => {
  loading.value = true;
  try {
    const res = await postApi.getAllPosts({
      search: searchTerm.value,
      limit: 20,
      isDeleted: true,
      sortBy: 'createdAt',
    });
    items.value = (res.data ?? []).map(toItem);
  } catch {
    items.value = [];
  } finally {
    loading.value = false;
  }
};

watchDebounced(searchTerm, search, { debounce: 300 });
await search();

const options = computed(() =>
  selected.value && !items.value.some((item) => item.id === selected.value!.id)
    ? [selected.value, ...items.value]
    : items.value
);

const onUpdate = (id: string | undefined) => {
  postId.value = id || undefined;
  selected.value = options.value.find((item) => item.id === id);
};
</script>

<template>
  <USelectMenu
    v-model:search-term="searchTerm"
    :model-value="postId"
    :items="options"
    value-key="id"
    label-key="title"
    :loading="loading"
    ignore-filter
    clear
    placeholder="Найдите новость по названию"
    icon="i-lucide-newspaper"
    :search-input="{ placeholder: 'Название новости…' }"
    :ui="{ content: 'max-w-[min(32rem,90vw)]' }"
    class="w-full"
    @update:model-value="onUpdate"
  />
</template>
