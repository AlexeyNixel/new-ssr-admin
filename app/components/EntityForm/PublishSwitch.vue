<script setup lang="ts">
// Переключатель «Показывать на сайте» поверх soft-delete флага isDeleted
const isDeleted = defineModel<boolean>({ required: true });

defineProps<{
  shownText: string;
  hiddenText: string;
}>();

const isPublished = computed({
  get: () => !isDeleted.value,
  set: (value: boolean) => {
    isDeleted.value = !value;
  },
});
</script>

<template>
  <USwitch
    v-model="isPublished"
    label="Показывать на сайте"
    :description="isPublished ? shownText : hiddenText"
  />
</template>
