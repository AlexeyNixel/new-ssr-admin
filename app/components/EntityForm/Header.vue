<script setup lang="ts">
/*
 * Липкая шапка полноэкранной формы редактирования: «назад», раздел и
 * заголовок, индикатор несохранённых изменений, статус, ссылка на сайт и
 * кнопка сохранения (type="submit" — компонент кладётся внутрь UForm).
 */
defineProps<{
  backTo: string;
  backLabel: string;
  section: string;
  title: string;
  status?: { label: string; color: 'neutral' | 'success' | 'warning' | 'error' | 'info' | 'primary' };
  isDirty?: boolean;
  saving?: boolean;
  submitLabel: string;
  siteUrl?: string;
}>();
</script>

<template>
  <header class="sticky top-0 z-30 h-16 border-b border-default bg-default/90 backdrop-blur">
    <div class="mx-auto flex h-full max-w-7xl items-center gap-2 px-4 sm:gap-3 sm:px-6">
      <UButton
        :to="backTo"
        icon="i-lucide-arrow-left"
        color="neutral"
        variant="ghost"
        :aria-label="backLabel"
      />

      <div class="min-w-0 flex-1">
        <p class="hidden text-xs text-muted sm:block">{{ section }}</p>
        <p class="truncate text-base font-semibold text-highlighted sm:text-lg">
          {{ title }}
        </p>
      </div>

      <span v-if="isDirty" class="hidden items-center gap-1.5 text-xs text-warning md:flex">
        <span class="size-1.5 rounded-full bg-warning" />
        Не сохранено
      </span>

      <UBadge
        v-if="status"
        :label="status.label"
        :color="status.color"
        variant="subtle"
        class="hidden sm:inline-flex"
      />

      <slot name="actions" />

      <UTooltip v-if="siteUrl" text="Открыть на сайте">
        <UButton
          :to="siteUrl"
          target="_blank"
          icon="i-lucide-external-link"
          color="neutral"
          variant="outline"
          aria-label="Открыть на сайте"
        />
      </UTooltip>

      <UTooltip :kbds="['ctrl', 'S']" text="Сохранить">
        <UButton type="submit" icon="i-lucide-save" :loading="saving" color="primary">
          <span class="hidden sm:inline">{{ submitLabel }}</span>
        </UButton>
      </UTooltip>
    </div>
  </header>
</template>
