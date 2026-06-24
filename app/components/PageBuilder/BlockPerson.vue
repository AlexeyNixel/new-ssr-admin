<script setup lang="ts">
/* eslint-disable vue/no-mutating-props */
import type { PagePersonBlock } from '~~/services/types/page.type';

const props = defineProps<{
  block: PagePersonBlock;
}>();
</script>

<template>
  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
    <UFormField label="Имя" required>
      <UInput
        v-model="props.block.name"
        placeholder="Иванова Анна Ивановна"
        class="w-full"
      />
    </UFormField>
    <UFormField label="Должность" required>
      <UInput
        v-model="props.block.position"
        placeholder="Заведующая отделом"
        class="w-full"
      />
    </UFormField>
    <UFormField label="Иконка" description="Необязательно" class="md:col-span-2">
      <div class="flex items-center gap-2">
        <div
          class="p-2 bg-neutral-50 dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700"
        >
          <UIcon
            :name="props.block.icon || 'i-heroicons-user-circle'"
            class="text-lg text-neutral-600 dark:text-neutral-300"
          />
        </div>
        <UInput v-model="props.block.icon" placeholder="i-heroicons-user-circle" class="flex-1" />
      </div>
    </UFormField>
  </div>
</template>

<style scoped></style>
