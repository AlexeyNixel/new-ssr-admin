<script setup lang="ts">
import type { DropdownMenuItem } from '@nuxt/ui';

// Кнопка «⋯» с меню действий строки. Клики не долетают до строки таблицы.
defineProps<{
  items: DropdownMenuItem[] | DropdownMenuItem[][];
}>();
</script>

<template>
  <div class="flex justify-end" @click.stop>
    <UDropdownMenu :items="items" :content="{ align: 'end' }">
      <UButton
        icon="i-lucide-ellipsis"
        color="neutral"
        variant="ghost"
        size="sm"
        aria-label="Действия"
      />
    </UDropdownMenu>
  </div>
</template>
