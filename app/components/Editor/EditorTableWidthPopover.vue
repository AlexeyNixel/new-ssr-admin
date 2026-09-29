<script setup lang="ts">
import type { Editor } from '@tiptap/vue-3';
import {
  getCurrentColumnWidth,
  getTablePercentTotal,
  type ColumnWidthUnit,
} from '~/components/Editor/tableColumnWidth';

const props = defineProps<{
  editor: Editor;
}>();

// Открытость пробрасываем наружу: пока поповер открыт, редактор теряет фокус,
// и тулбар таблицы не должен от этого скрываться
const open = defineModel<boolean>('open', { default: false });

const unit = ref<ColumnWidthUnit>('%');
const value = ref<number | null>(null);
const columns = ref(1);
const total = ref(0);

const units: ColumnWidthUnit[] = ['%', 'px'];

watch(open, (isOpen) => {
  if (!isOpen) return;
  const current = getCurrentColumnWidth(props.editor.state);
  columns.value = current?.count ?? 1;
  total.value = getTablePercentTotal(props.editor.state);
  if (current?.px) {
    unit.value = 'px';
    value.value = current.px;
  } else {
    unit.value = '%';
    value.value = current?.percent ?? null;
  }
});

const title = computed(() =>
  columns.value > 1 ? `Ширина ${columns.value} столбцов` : 'Ширина столбца',
);

const run = (fn: (chain: ReturnType<Editor['chain']>) => ReturnType<Editor['chain']>) => {
  fn(props.editor.chain().focus()).run();
  open.value = false;
};

const apply = () => run((c) => c.setColumnWidth(value.value, unit.value));
const setAuto = () => run((c) => c.setColumnWidth(null));
const distribute = () => run((c) => c.distributeColumns());
const reset = () => run((c) => c.resetColumnWidths());
</script>

<template>
  <UPopover v-model:open="open">
    <UTooltip text="Ширина столбцов">
      <UButton
        icon="i-lucide-move-horizontal"
        color="neutral"
        variant="ghost"
        size="sm"
        :disabled="!editor.isEditable"
      />
    </UTooltip>

    <template #content>
      <form class="flex w-72 flex-col gap-3 p-3" @submit.prevent="apply">
        <UFormField
          :label="title"
          :help="
            unit === '%'
              ? `От ширины таблицы. Сейчас в % занято: ${total}%`
              : 'Фиксированная ширина в пикселях'
          "
        >
          <div class="flex gap-2">
            <UInputNumber
              v-model="value"
              autofocus
              :min="1"
              :max="unit === '%' ? 100 : 2000"
              :step="unit === '%' ? 5 : 10"
              :step-snapping="false"
              placeholder="Авто"
              class="flex-1"
            />
            <UFieldGroup>
              <UButton
                v-for="u in units"
                :key="u"
                :label="u"
                size="sm"
                color="neutral"
                :variant="unit === u ? 'solid' : 'outline'"
                @click="() => { unit = u; }"
              />
            </UFieldGroup>
          </div>
        </UFormField>

        <div class="flex justify-between gap-2">
          <UButton size="sm" color="neutral" variant="ghost" label="Авто" @click="setAuto" />
          <UButton type="submit" size="sm" label="Применить" :disabled="!value" />
        </div>

        <USeparator />

        <div class="flex flex-col gap-1">
          <UButton
            size="sm"
            color="neutral"
            variant="ghost"
            icon="i-lucide-columns-3"
            label="Все столбцы поровну"
            @click="distribute"
          />
          <UButton
            size="sm"
            color="neutral"
            variant="ghost"
            icon="i-lucide-rotate-ccw"
            label="Сбросить ширину столбцов"
            @click="reset"
          />
        </div>
      </form>
    </template>
  </UPopover>
</template>
