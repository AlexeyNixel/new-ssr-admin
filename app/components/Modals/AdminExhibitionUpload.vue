<script setup lang="ts">
import { API_ENDPOINTS } from '~~/services/endpoints';
import type { Exhibition } from '~~/services/types/exhibition.type';

const emit = defineEmits<{ close: [boolean] }>();

const toast = useToast();
const apiBase = useRuntimeConfig().public.apiBaseUrl as string;

const zip = ref<File | null>(null);
const cover = ref<File | null>(null);
const title = ref('');
const progress = ref<number | null>(null);
const error = ref('');

/** Имя архива станет адресом страницы: v_bulgakov_135.zip → /page/exhibition/v_bulgakov_135 */
const slug = computed(() => zip.value?.name.replace(/\.zip$/i, '') ?? '');
const slugValid = computed(() => /^[\w-]{2,100}$/.test(slug.value) && /\.zip$/i.test(zip.value?.name ?? ''));
const siteUrl = (useRuntimeConfig().public.siteUrl as string).replace(/\/+$/, '').replace(/^https?:\/\//, '');

const uploading = computed(() => progress.value !== null);

const onSubmit = () => {
  if (!zip.value || !slugValid.value) return;
  error.value = '';

  const body = new FormData();
  body.append('file', zip.value);
  if (cover.value) body.append('cover', cover.value);
  if (title.value.trim()) body.append('title', title.value.trim());

  // XHR, а не $fetch: архивы бывают на сотни мегабайт — нужен прогресс
  const xhr = new XMLHttpRequest();
  xhr.open('POST', apiBase + API_ENDPOINTS.uploadExhibition);
  xhr.withCredentials = true;
  xhr.upload.onprogress = (event) => {
    if (event.lengthComputable) progress.value = Math.round((event.loaded / event.total) * 100);
  };
  xhr.onload = () => {
    let response: (Exhibition & { message?: string }) | null = null;
    try {
      response = JSON.parse(xhr.responseText);
    } catch {
      // ответ не JSON — покажем общий текст ошибки
    }
    if (xhr.status >= 200 && xhr.status < 300 && response) {
      toast.add({ title: `Выставка «${response.title || slug.value}» загружена`, color: 'success' });
      emit('close', true);
      return;
    }
    progress.value = null;
    error.value =
      typeof response?.message === 'string' ? response.message : `Не удалось загрузить (код ${xhr.status})`;
  };
  xhr.onerror = () => {
    progress.value = null;
    error.value = 'Нет связи с сервером';
  };
  progress.value = 0;
  xhr.send(body);
};
</script>

<template>
  <UModal
    title="Новая виртуальная выставка"
    description="ZIP-архив, опубликованный из iSpring (с index.html в корне)"
    :dismissible="false"
    :close="!uploading"
  >
    <template #body>
      <form class="space-y-5" @submit.prevent="onSubmit">
        <UFormField
          required
          label="Архив выставки"
          :error="zip && !slugValid ? 'Переименуйте архив: только латиница, цифры, «_» и «-»' : undefined"
        >
          <UFileUpload
            v-model="zip"
            accept=".zip,application/zip"
            label="Перетащите ZIP сюда"
            description="или нажмите, чтобы выбрать"
            icon="i-lucide-file-archive"
            class="w-full min-h-32"
            :disabled="uploading"
          />
        </UFormField>

        <p v-if="zip && slugValid" class="-mt-3 text-sm text-muted">
          Адрес на сайте:
          <span class="font-mono text-highlighted">{{ siteUrl }}/page/exhibition/{{ slug }}</span>
        </p>

        <UFormField label="Название" help="Оставьте пустым — возьмём из пакета iSpring, если оно там есть">
          <UInput v-model="title" placeholder="Рукописи не горят" class="w-full" :disabled="uploading" />
        </UFormField>

        <UFormField label="Обложка" help="Нужна, если в архиве нет cover.jpg. Лучше 16:9, от 1280 px в ширину">
          <UFileUpload
            v-model="cover"
            accept="image/*"
            label="Картинка обложки"
            icon="i-lucide-image"
            layout="list"
            class="w-full"
            :disabled="uploading"
          />
        </UFormField>

        <UAlert v-if="error" color="error" variant="subtle" icon="i-lucide-circle-alert" :title="error" />

        <div v-if="uploading" class="space-y-1">
          <UProgress v-model="progress" />
          <p class="text-xs text-muted">
            {{ progress! < 100 ? `Загружаем архив… ${progress}%` : 'Распаковываем и выкладываем файлы…' }}
          </p>
        </div>

        <div class="flex justify-end gap-3 border-t border-default pt-4">
          <UButton color="neutral" variant="ghost" :disabled="uploading" @click="emit('close', false)">
            Отмена
          </UButton>
          <UButton type="submit" icon="i-lucide-upload" :loading="uploading" :disabled="!zip || !slugValid">
            Загрузить
          </UButton>
        </div>
      </form>
    </template>
  </UModal>
</template>
