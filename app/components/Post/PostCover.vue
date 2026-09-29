<script setup lang="ts">
import { useUploadApi } from '~~/services/api/upload.api';

/*
 * Обложка новости: v-model — id файла, v-model:path — путь для превью.
 * В отличие от UiUploadImage показывает превью сразу после загрузки,
 * умеет заменять/удалять картинку и показывает состояние загрузки.
 */
const id = defineModel<string | undefined>({ default: undefined });
const path = defineModel<string>('path', { default: '' });

const props = withDefaults(
  defineProps<{
    invalid?: boolean;
    /** Пропорции области, CSS aspect-ratio */
    aspect?: string;
    alt?: string;
  }>(),
  { aspect: '16 / 10', alt: 'Обложка новости' }
);

const uploadApi = useUploadApi();
const toast = useToast();

const file = ref<File | null>(null);
const loading = ref(false);

const src = computed(() => (path.value ? `http://static.infomania.ru${path.value}` : ''));

watch(file, async (value) => {
  if (!value) return;

  loading.value = true;
  try {
    const body = new FormData();
    body.append('file', value);
    const result = await uploadApi.uploadImage(body);
    id.value = result.id;
    path.value = result.path;
  } catch {
    toast.add({ title: 'Не удалось загрузить изображение', color: 'error' });
  } finally {
    loading.value = false;
    // сбрасываем, чтобы повторный выбор того же файла снова сработал
    file.value = null;
  }
});

const remove = () => {
  id.value = undefined;
  path.value = '';
};
</script>

<template>
  <!-- aspect-ratio на обёртке: UFileUpload отдаёт style скрытому input, а не корню -->
  <div class="w-full" :style="{ aspectRatio: props.aspect }">
    <UFileUpload
      v-model="file"
      accept="image/*"
      :preview="false"
      icon="i-lucide-image-plus"
      label="Перетащите изображение"
      description="или нажмите, чтобы выбрать файл"
      :disabled="loading"
      class="size-full"
      :ui="{
        base: [
          'h-full min-h-0 rounded-lg',
          invalid ? 'border-error' : '',
        ],
      }"
    >
      <template v-if="src || loading" #default="{ open }">
        <div
          class="group relative size-full overflow-hidden rounded-lg border border-default bg-elevated"
        >
          <img
            v-if="src"
            :src="src"
            :alt="props.alt"
            class="size-full object-cover"
          >

          <div
            v-if="loading"
            class="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-default/80 text-sm text-muted"
          >
            <UIcon name="i-lucide-loader-circle" class="size-6 animate-spin" />
            Загрузка…
          </div>

          <div
            v-else
            class="absolute inset-x-0 bottom-0 flex justify-end gap-2 bg-gradient-to-t from-black/60 to-transparent p-2 opacity-100 transition-opacity lg:opacity-0 lg:group-hover:opacity-100 lg:group-focus-within:opacity-100"
          >
            <UButton
              icon="i-lucide-replace"
              label="Заменить"
              size="xs"
              color="neutral"
              variant="solid"
              @click="open()"
            />
            <UButton
              icon="i-lucide-trash-2"
              size="xs"
              color="error"
              variant="solid"
              aria-label="Удалить обложку"
              @click="remove"
            />
          </div>
        </div>
      </template>
    </UFileUpload>
  </div>
</template>
