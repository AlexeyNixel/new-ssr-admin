<script setup lang="ts">
import { useExhibitionApi } from '~~/services/api/exhibition.api';
import type { Exhibition } from '~~/services/types/exhibition.type';

const props = defineProps<{ exhibition: Exhibition }>();
const emit = defineEmits<{ close: [boolean] }>();

const toast = useToast();
const exhibitionApi = useExhibitionApi();

const title = ref(props.exhibition.title ?? '');
const cover = ref<File | null>(null);
const saving = ref(false);
const legacy = exhibitionIsLegacy(props.exhibition);

const coverPreview = computed(() => (cover.value ? URL.createObjectURL(cover.value) : exhibitionCover(props.exhibition)));
watch(coverPreview, (_, previous) => {
  if (previous?.startsWith('blob:')) URL.revokeObjectURL(previous);
});

const errorMessage = (error: unknown) => {
  const message = (error as { data?: { message?: string } })?.data?.message;
  return typeof message === 'string' ? message : undefined;
};

const onSubmit = async () => {
  saving.value = true;
  try {
    if (title.value.trim() !== (props.exhibition.title ?? '')) {
      await exhibitionApi.update(props.exhibition.id, { title: title.value.trim() || null });
    }
    if (cover.value) {
      const body = new FormData();
      body.append('cover', cover.value);
      await exhibitionApi.replaceCover(props.exhibition.id, body);
    }
    toast.add({ title: 'Выставка сохранена', color: 'success' });
    emit('close', true);
  } catch (error) {
    toast.add({ title: 'Не удалось сохранить', description: errorMessage(error), color: 'error' });
  } finally {
    saving.value = false;
  }
};
</script>

<template>
  <UModal title="Выставка" :description="`/page/exhibition/${exhibitionSlug(exhibition)}`" :dismissible="false">
    <template #body>
      <form class="space-y-5" @submit.prevent="onSubmit">
        <UFormField label="Название" help="Показывается на сайте в заголовке страницы выставки">
          <UInput v-model="title" :placeholder="exhibitionSlug(exhibition)" class="w-full" maxlength="300" />
        </UFormField>

        <UFormField label="Обложка">
          <img
            :src="coverPreview"
            alt=""
            class="mb-3 aspect-video w-full rounded-lg bg-elevated object-cover ring-1 ring-default"
          >
          <UAlert
            v-if="legacy"
            color="neutral"
            variant="subtle"
            icon="i-lucide-lock"
            description="Выставка перенесена со старого сайта — её файлы только для чтения, обложку заменить нельзя"
          />
          <UFileUpload
            v-else
            v-model="cover"
            accept="image/*"
            label="Заменить обложку"
            icon="i-lucide-image"
            layout="list"
            class="w-full"
          />
        </UFormField>

        <div class="flex justify-end gap-3 border-t border-default pt-4">
          <UButton color="neutral" variant="ghost" @click="emit('close', false)">Отмена</UButton>
          <UButton type="submit" icon="i-lucide-check" :loading="saving">Сохранить</UButton>
        </div>
      </form>
    </template>
  </UModal>
</template>
