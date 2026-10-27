<script setup lang="ts">
import { useShortLinkApi } from '~~/services/api/short-link.api';
import type { IShortLink } from '~~/services/types/short-link.type';
import { shortLinkSchema } from '~/schemas/short-link.schema';

const props = defineProps<{
  shortLink?: IShortLink;
}>();

const emit = defineEmits<{ close: [boolean] }>();

const toast = useToast();
const shortLinkApi = useShortLinkApi();
const linkUrl = useShortLinkUrl();
const isLoading = ref(false);
const schema = shortLinkSchema;

const { entity: shortLink, pending, notFound } = useModalEntity({
  prop: props.shortLink,
  fetchById: (id) => shortLinkApi.getOneShortLink(id),
});
const isUpdate = computed(() => !!shortLink.value);

const newShortLink = ref({
  title: '',
  url: '',
  slug: '',
});

watch(
  shortLink,
  (value) => {
    if (!value) return;
    newShortLink.value = {
      title: value.title || '',
      url: value.url,
      slug: value.slug,
    };
  },
  { immediate: true }
);

const slugPreview = computed(() => newShortLink.value.slug.trim().toLowerCase());
const slugChanged = computed(
  () => isUpdate.value && !!slugPreview.value && slugPreview.value !== shortLink.value?.slug
);

const onSubmit = async () => {
  isLoading.value = true;

  const payload = {
    title: newShortLink.value.title.trim() || null,
    url: newShortLink.value.url.trim(),
    slug: slugPreview.value || undefined,
  };

  try {
    if (isUpdate.value && shortLink.value) {
      await shortLinkApi.updateShortLink(shortLink.value.id, payload);
      toast.add({ title: 'Ссылка обновлена' });
    } else {
      await shortLinkApi.createShortLink(payload);
      toast.add({ title: 'Ссылка создана' });
    }

    emit('close', true);
  } catch (error) {
    // 409 «Такой адрес уже занят», 400 — неверный адрес/хвост
    const message = (error as { data?: { message?: string } })?.data?.message;
    toast.add({
      title: 'Не удалось сохранить ссылку',
      description: typeof message === 'string' ? message : undefined,
      color: 'error',
    });
  } finally {
    isLoading.value = false;
  }
};
</script>

<template>
  <UModal
    :title="isUpdate ? 'Редактирование короткой ссылки' : 'Новая короткая ссылка'"
    :description="
      isUpdate
        ? 'Внесите изменения в короткую ссылку'
        : 'Длинная или сторонняя ссылка превратится в короткую на домене сайта'
    "
    :dismissible="false"
  >
    <template #body>
      <div v-if="pending" class="flex items-center justify-center py-12">
        <UIcon
          name="i-heroicons-arrow-path"
          class="w-6 h-6 animate-spin text-neutral-400"
        />
      </div>

      <div
        v-else-if="notFound"
        class="py-12 text-center text-neutral-500 dark:text-neutral-400"
      >
        Запись не найдена
      </div>

      <div v-else class="flex flex-col w-full">
        <UForm
          :schema="schema"
          :state="newShortLink"
          class="space-y-5"
          @submit="onSubmit"
        >
          <UFormField name="title" label="Название" help="Для себя: о какой акции или событии ссылка">
            <UInput
              v-model="newShortLink.title"
              placeholder="Летние чтения 2026"
              class="w-full"
              size="md"
            />
          </UFormField>

          <UFormField required name="url" label="Куда ведёт">
            <UInput
              v-model="newShortLink.url"
              icon="i-lucide-link"
              placeholder="https://…"
              class="w-full"
              size="md"
            />
          </UFormField>

          <UFormField
            name="slug"
            label="Короткий адрес"
            help="Латинские буквы, цифры и дефис. Оставьте пустым — адрес придумается сам"
          >
            <UFieldGroup class="w-full">
              <UBadge
                color="neutral"
                variant="outline"
                size="lg"
                :label="linkUrl.displayPrefix"
              />
              <UInput
                v-model="newShortLink.slug"
                :placeholder="isUpdate ? '' : 'leto2026'"
                class="w-full"
                size="md"
              />
            </UFieldGroup>
          </UFormField>

          <UAlert
            v-if="slugChanged"
            color="warning"
            variant="subtle"
            icon="i-lucide-triangle-alert"
            title="Старый адрес перестанет работать"
            :description="`${linkUrl.display(shortLink!.slug)} будет вести на главную сайта`"
          />

          <p v-if="isUpdate && shortLink" class="text-sm text-muted">
            Переходов: <span class="font-medium text-highlighted">{{ shortLink.clicks }}</span>
          </p>

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
              {{ isUpdate ? 'Сохранить изменения' : 'Создать ссылку' }}
            </UButton>
          </div>
        </UForm>
      </div>
    </template>
  </UModal>
</template>
