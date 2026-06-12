<script setup lang="ts">
const items = defineModel<string[]>({ required: true });

withDefaults(
  defineProps<{
    placeholder?: string;
    addLabel?: string;
  }>(),
  {
    placeholder: 'Введите значение',
    addLabel: 'Добавить элемент',
  }
);

const add = () => {
  items.value.push('');
};

const remove = (index: number) => {
  items.value.splice(index, 1);
};
</script>

<template>
  <div class="space-y-2">
    <div v-for="(item, index) in items" :key="index" class="flex items-center gap-2">
      <UInput v-model="items[index]" :placeholder="placeholder" class="w-full" size="md" />
      <UButton
        icon="i-heroicons-x-mark-20-solid"
        color="neutral"
        variant="ghost"
        size="sm"
        @click="remove(index)"
      />
    </div>
    <UButton
      icon="i-heroicons-plus-20-solid"
      color="neutral"
      variant="subtle"
      size="sm"
      :label="addLabel"
      @click="add"
    />
  </div>
</template>

<style scoped></style>
