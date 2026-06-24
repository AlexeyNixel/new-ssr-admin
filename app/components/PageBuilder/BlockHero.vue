<script setup lang="ts">
/* eslint-disable vue/no-mutating-props */
import type { PageHeroBlock } from '~~/services/types/page.type';

const props = defineProps<{
  block: PageHeroBlock;
}>();

if (!props.block.contacts) {
  props.block.contacts = {};
}
</script>

<template>
  <div class="space-y-4">
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <UFormField label="Заголовок" required>
        <UInput
          v-model="props.block.title"
          placeholder="Например: Медиатека"
          class="w-full"
        />
      </UFormField>

      <UFormField
        label="Иконка"
        description="Имя иконки из Iconify (например: i-heroicons-musical-note)"
      >
        <div class="flex items-center gap-2">
          <div
            class="p-2 bg-neutral-50 dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700"
          >
            <UIcon
              :name="props.block.icon || 'i-heroicons-question-mark-circle-20-solid'"
              class="text-lg text-neutral-600 dark:text-neutral-300"
            />
          </div>
          <UInput
            v-model="props.block.icon"
            placeholder="i-heroicons-musical-note"
            class="flex-1"
          />
        </div>
      </UFormField>
    </div>

    <UFormField label="Метка над заголовком" description="Например: «Отдел медиатека»">
      <UInput v-model="props.block.label" placeholder="Отдел медиатека" class="w-full" />
    </UFormField>

    <UFormField label="Подзаголовок">
      <UTextarea
        v-model="props.block.subtitle"
        :rows="2"
        placeholder="Краткое описание отдела"
        class="w-full"
      />
    </UFormField>

    <div
      class="p-4 bg-neutral-50 dark:bg-neutral-800/50 rounded-xl border border-neutral-200 dark:border-neutral-700 space-y-3"
    >
      <p class="text-sm font-medium text-neutral-900 dark:text-white">
        Контактная карточка
      </p>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
        <UFormField label="Телефон">
          <UInput
            v-model="props.block.contacts!.phone"
            placeholder="+7 (383) 210-12-04"
            icon="i-heroicons-phone"
            class="w-full"
          />
        </UFormField>
        <UFormField label="Email">
          <UInput
            v-model="props.block.contacts!.email"
            placeholder="example@infomania.ru"
            icon="i-heroicons-envelope"
            class="w-full"
          />
        </UFormField>
        <UFormField label="Адрес">
          <UInput
            v-model="props.block.contacts!.address"
            placeholder="Адрес отдела"
            icon="i-heroicons-map-pin"
            class="w-full"
          />
        </UFormField>
        <UFormField label="Часы работы">
          <UInput
            v-model="props.block.contacts!.workHours"
            placeholder="Пн-Пт 10:00-19:00"
            icon="i-heroicons-clock"
            class="w-full"
          />
        </UFormField>
      </div>
      <p class="text-xs text-neutral-500 dark:text-neutral-400">
        Оставьте поля контактов пустыми, если карточка не нужна
      </p>
    </div>
  </div>
</template>

<style scoped></style>
