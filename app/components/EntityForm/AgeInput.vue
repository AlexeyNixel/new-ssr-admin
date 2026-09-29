<script setup lang="ts">
// Возрастное ограничение: число + быстрый выбор стандартных значений (ФЗ-436)
const model = defineModel<number | null | undefined>();

const PRESETS = [0, 6, 12, 16, 18];

const select = (age: number) => {
  model.value = age;
};
</script>

<template>
  <div class="space-y-2">
    <UInputNumber
      v-model="model"
      :min="0"
      :max="99"
      placeholder="—"
      class="w-full"
    />
    <div class="flex flex-wrap gap-1">
      <UButton
        v-for="age in PRESETS"
        :key="age"
        :label="`${age}+`"
        size="xs"
        :color="model === age ? 'primary' : 'neutral'"
        :variant="model === age ? 'soft' : 'outline'"
        @click="select(age)"
      />
    </div>
  </div>
</template>
