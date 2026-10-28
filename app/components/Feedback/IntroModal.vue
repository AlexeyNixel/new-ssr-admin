<script setup lang="ts">
import { FEEDBACK_TYPES } from '~/utils/feedbackTypes';

// Объявление о разделе «Ошибки и пожелания»: для чего он и как им пользоваться.
// Само показывается один раз после входа, повторно — кнопкой «Как это работает» на /feedback.
const emit = defineEmits<{ close: ['report' | 'later'] }>();

const types = [
  { ...FEEDBACK_TYPES.BUG, colorClass: 'text-error bg-error/10', text: 'не сохраняется, пропало, выдаёт ошибку' },
  { ...FEEDBACK_TYPES.CHANGE, colorClass: 'text-warning bg-warning/10', text: 'неудобно, долго, непонятно' },
  { ...FEEDBACK_TYPES.IDEA, colorClass: 'text-info bg-info/10', text: 'чего не хватает в работе с сайтом' },
];

const steps = [
  { title: 'Нажмите «Сообщить об ошибке»', text: 'Кнопка внизу меню слева, работает на любой странице.' },
  { title: 'Выберите тип и опишите суть', text: 'Одной фразой, подробности и скриншот — по желанию. Адрес страницы подставится сам.' },
  { title: 'Отправьте', text: 'Обращение попадёт в список задач разработчика.' },
  { title: 'Получите уведомление', text: 'Когда задачу выполнят, придёт сообщение. Все обращения — в разделе «Ошибки и пожелания».' },
];
</script>

<template>
  <UModal :dismissible="false" :close="false">
    <template #content>
      <div class="max-h-[90vh] overflow-y-auto p-6 sm:p-7">
        <div class="mb-4 flex items-center gap-3">
          <div class="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <UIcon name="i-lucide-megaphone" class="size-6" />
          </div>
          <div>
            <UBadge label="Новое в админке" color="primary" variant="subtle" size="sm" />
            <h2 class="mt-1 mb-0! text-xl! font-semibold! text-highlighted">Ошибки и пожелания</h2>
          </div>
        </div>

        <!-- Для чего -->
        <p class="text-sm text-default">
          Теперь о проблемах в админке можно сообщить прямо отсюда — не нужно ловить разработчика лично
          или писать в мессенджер. Сообщайте обо всём, что мешает работать:
        </p>

        <ul class="my-4 space-y-2">
          <li v-for="type in types" :key="type.label" class="flex items-center gap-3">
            <span :class="['flex size-7 shrink-0 items-center justify-center rounded-lg', type.colorClass]">
              <UIcon :name="type.icon" class="size-4" />
            </span>
            <p class="text-sm">
              <b class="text-highlighted">{{ type.label }}</b>
              <span class="text-muted"> — {{ type.text }}</span>
            </p>
          </li>
        </ul>

        <div class="mb-5 flex gap-3 rounded-xl border border-success/30 bg-success/5 p-3 text-sm">
          <UIcon name="i-lucide-zap" class="mt-0.5 size-5 shrink-0 text-success" />
          <p class="text-default">
            <b>Обращения из этого списка исправляются намного быстрее</b> — они не теряются, и разработчик
            видит их все в одном месте.
          </p>
        </div>

        <!-- Краткая инструкция -->
        <p class="mb-3 text-xs font-semibold uppercase tracking-wide text-muted">Как сообщить</p>
        <ol class="mb-6 space-y-3">
          <li v-for="(step, index) in steps" :key="step.title" class="flex gap-3">
            <span
              class="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-inverted tabular-nums"
            >
              {{ index + 1 }}
            </span>
            <div>
              <p class="text-sm font-medium text-highlighted">{{ step.title }}</p>
              <p class="text-xs text-muted">{{ step.text }}</p>
            </div>
          </li>
        </ol>

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
