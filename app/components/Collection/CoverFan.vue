<script setup lang="ts">
// Веер обложек первых книг подборки — так карточка подборки выглядит на сайте
const props = withDefaults(
  defineProps<{
    covers: { id: string; preview?: { path?: string | null } | null }[];
    /** Высота обложки, px */
    height?: number;
  }>(),
  { height: 120 }
);

// Раскладка до 4 обложек: сдвиг и поворот от центра к краям
const LAYOUT = [
  [{ x: 0, r: 0 }],
  [{ x: -22, r: -6 }, { x: 22, r: 6 }],
  [{ x: -38, r: -9 }, { x: 0, r: 0 }, { x: 38, r: 9 }],
  [{ x: -54, r: -12 }, { x: -18, r: -4 }, { x: 18, r: 4 }, { x: 54, r: 12 }],
];

const items = computed(() => {
  const list = props.covers.slice(0, 4);
  const layout = LAYOUT[list.length - 1] ?? [];
  const scale = props.height / 120;
  return list.map((cover, index) => ({
    id: cover.id,
    src: staticUrl(cover.preview?.path),
    style: {
      height: `${props.height}px`,
      transform: `translateX(${(layout[index]?.x ?? 0) * scale}px) rotate(${layout[index]?.r ?? 0}deg)`,
      zIndex: index === Math.floor(list.length / 2) ? 10 : index,
    },
  }));
});
</script>

<template>
  <div
    class="relative flex items-end justify-center"
    :style="{ height: `${height + 16}px` }"
  >
    <template v-if="items.length">
      <img
        v-for="item in items"
        :key="item.id"
        :src="item.src"
        alt=""
        loading="lazy"
        class="absolute bottom-1 aspect-[2/3] rounded-sm bg-elevated object-cover shadow-md ring-1 ring-black/10"
        :style="item.style"
      >
    </template>
    <div
      v-else
      class="flex aspect-[2/3] items-center justify-center rounded-sm border-2 border-dashed border-default text-muted"
      :style="{ height: `${height}px` }"
    >
      <UIcon name="i-lucide-book-plus" class="size-6" />
    </div>
  </div>
</template>
