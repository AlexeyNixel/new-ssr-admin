<script setup lang="ts">
import { FEEDBACK_TYPES } from '~/utils/feedbackTypes';

// Знакомство с «Ошибками и пожеланиями» — показывается один раз каждому пользователю
const emit = defineEmits<{ close: ['report' | 'later'] }>();

const points = [
  { icon: FEEDBACK_TYPES.BUG.icon, color: 'text-error', title: 'Что-то работает не так', text: 'Не сохраняется, пропало, выдаёт ошибку' },
  { icon: FEEDBACK_TYPES.CHANGE.icon, color: 'text-warning', title: 'Что нужно переделать', text: 'Неудобно, долго, непонятно' },
  { icon: FEEDBACK_TYPES.IDEA.icon, color: 'text-info', title: 'Новые идеи', text: 'Чего не хватает в работе с сайтом' },
];
</script>

<template>
  <UModal :dismissible="false" :close="false" :ui="{ content: 'max-w-md' }">
    <template #content>
      <div class="p-6 sm:p-7">
        <div class="mb-4 flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <UIcon name="i-lucide-message-square-warning" class="size-6" />
        </div>

        <h2 class="mb-1! text-xl! font-semibold! text-highlighted">Новое: ошибки и пожелания</h2>
        <p class="text-sm text-muted">
          Теперь о проблемах в админке можно сообщить прямо отсюда — не нужно ловить разработчика лично
          или писать в мессенджер.
        </p>

        <ul class="my-5 space-y-3">
          <li v-for="point in points" :key="point.title" class="flex gap-3">
            <UIcon :name="point.icon" :class="['mt-0.5 size-5 shrink-0', point.color]" />
            <div>
              <p class="text-sm font-medium text-highlighted">{{ point.title }}</p>
              <p class="text-xs text-muted">{{ point.text }}</p>
            </div>
          </li>
        </ul>

        <div class="mb-5 flex gap-3 rounded-xl border border-success/30 bg-success/5 p-3 text-sm">
          <UIcon name="i-lucide-zap" class="mt-0.5 size-5 shrink-0 text-success" />
          <p class="text-default">
            <b>Обращения из этого списка исправляются намного быстрее</b> — они не теряются, а когда задача
            будет выполнена, вы получите уведомление.
          </p>
        </div>

        <p class="mb-5 text-xs text-muted">
          Кнопка <b>«Сообщить об ошибке»</b> всегда внизу меню слева, адрес текущей страницы подставится сам.
          Все обращения — в разделе <b>«Ошибки и пожелания»</b>.
        </p>

        <div class="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <UButton color="neutral" variant="outline" label="Понятно" block class="sm:w-auto" @click="emit('close', 'later')" />
          <UButton
            color="primary"
            icon="i-lucide-send"
            label="Сообщить сейчас"
            block
            class="sm:w-auto"
            @click="emit('close', 'report')"
          />
        </div>
      </div>
    </template>
  </UModal>
</template>
