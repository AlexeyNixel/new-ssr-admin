<script setup lang="ts">
const props = defineProps<{
  items: { label: string; done: boolean }[];
}>();

const readyCount = computed(() => props.items.filter((item) => item.done).length);
</script>

<template>
  <EntityFormCard title="Готовность" icon="i-lucide-list-checks" class="space-y-3!">
    <template #trailing>
      <span class="tabular-nums text-muted">{{ readyCount }} / {{ items.length }}</span>
    </template>

    <UProgress
      :model-value="readyCount"
      :max="items.length"
      size="sm"
      :color="readyCount === items.length ? 'success' : 'primary'"
    />
    <ul class="space-y-1.5 text-sm">
      <li v-for="item in items" :key="item.label" class="flex items-center gap-2">
        <UIcon
          :name="item.done ? 'i-lucide-circle-check' : 'i-lucide-circle'"
          class="size-4 shrink-0"
          :class="item.done ? 'text-success' : 'text-dimmed'"
        />
        <span :class="item.done ? 'text-default' : 'text-muted'">{{ item.label }}</span>
      </li>
    </ul>
    <p class="hidden text-xs text-dimmed lg:block">
      Сохранить можно клавишами <UKbd value="ctrl" size="sm" /> + <UKbd value="S" size="sm" />
    </p>
  </EntityFormCard>
</template>
