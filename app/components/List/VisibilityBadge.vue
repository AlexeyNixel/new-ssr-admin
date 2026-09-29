<script setup lang="ts">
/*
 * Бейдж «Опубликовано / Скрыто» с быстрым переключением по клику.
 * toggle — async-функция сохранения; на время запроса бейдж блокируется.
 */
const props = withDefaults(
  defineProps<{
    hidden: boolean;
    toggle?: () => Promise<unknown>;
    shownLabel?: string;
    hiddenLabel?: string;
  }>(),
  { shownLabel: 'На сайте', hiddenLabel: 'Скрыто', toggle: undefined }
);

const busy = ref(false);

const onClick = async (event: MouseEvent) => {
  // строка таблицы по клику открывает редактор — не пускаем клик дальше
  event.stopPropagation();
  if (!props.toggle || busy.value) return;
  busy.value = true;
  try {
    await props.toggle();
  } finally {
    busy.value = false;
  }
};
</script>

<template>
  <UTooltip
    :text="toggle ? (hidden ? 'Нажмите, чтобы показать на сайте' : 'Нажмите, чтобы скрыть') : undefined"
    :disabled="!toggle"
  >
    <UBadge
      as="button"
      type="button"
      :color="hidden ? 'neutral' : 'success'"
      variant="subtle"
      :icon="busy ? 'i-lucide-loader-circle' : hidden ? 'i-lucide-eye-off' : 'i-lucide-eye'"
      :label="hidden ? hiddenLabel : shownLabel"
      class="w-max whitespace-nowrap"
      :class="[toggle ? 'cursor-pointer hover:ring-accented' : 'cursor-default', busy && '[&_svg]:animate-spin']"
      @click="onClick"
    />
  </UTooltip>
</template>
