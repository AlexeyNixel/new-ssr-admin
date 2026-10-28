<script setup lang="ts">
import { ALL_SECTIONS, SECTION_GROUPS, SECTION_TEMPLATES } from '~/constants/sections';

/*
 * Выбор разделов админки для сотрудника. v-model: null — полный доступ
 * (в том числе к разделам, которые появятся позже), массив — только отмеченные.
 */
const model = defineModel<string[] | null>({ required: true });

const fullAccess = computed({
  get: () => model.value === null,
  // Снимая полный доступ, оставляем отмеченным всё — дальше снимают лишнее
  set: (value: boolean) => (model.value = value ? null : ALL_SECTIONS.map((section) => section.key)),
});

const isChecked = (key: string) => model.value === null || model.value.includes(key);

const toggle = (key: string, checked: boolean) => {
  const current = model.value ?? ALL_SECTIONS.map((section) => section.key);
  model.value = checked ? [...new Set([...current, key])] : current.filter((item) => item !== key);
};

const groupState = (keys: string[]) => {
  const checked = keys.filter(isChecked).length;
  return checked === keys.length ? true : checked ? 'indeterminate' : false;
};

const toggleGroup = (keys: string[], checked: boolean) => {
  const current = model.value ?? ALL_SECTIONS.map((section) => section.key);
  model.value = checked ? [...new Set([...current, ...keys])] : current.filter((key) => !keys.includes(key));
};

const applyTemplate = (sections: string[] | null) => {
  model.value = sections ? [...sections] : null;
};

const isTemplate = (sections: string[] | null) =>
  sections === null
    ? model.value === null
    : model.value !== null && model.value.length === sections.length && sections.every((key) => model.value!.includes(key));

const summary = computed(() => {
  if (model.value === null) return 'Все разделы, включая будущие';
  if (!model.value.length) return 'Ни одного раздела — сотрудник увидит только главную';
  return `${model.value.length} из ${ALL_SECTIONS.length}`;
});
</script>

<template>
  <div class="space-y-3">
    <div class="flex flex-wrap gap-1.5">
      <UButton
        v-for="template in SECTION_TEMPLATES"
        :key="template.label"
        :icon="template.icon"
        size="xs"
        :color="isTemplate(template.sections) ? 'primary' : 'neutral'"
        :variant="isTemplate(template.sections) ? 'solid' : 'outline'"
        @click="applyTemplate(template.sections)"
      >
        {{ template.label }}
      </UButton>
    </div>

    <p class="text-xs" :class="model !== null && !model.length ? 'text-warning' : 'text-muted'">{{ summary }}</p>

    <USwitch v-model="fullAccess" label="Полный доступ" description="Новые разделы админки откроются автоматически" />

    <div v-if="model !== null" class="grid gap-x-6 gap-y-4 rounded-lg p-3 ring-1 ring-default sm:grid-cols-2">
      <fieldset v-for="group in SECTION_GROUPS" :key="group.label" class="space-y-1.5">
        <UCheckbox
          :model-value="groupState(group.sections.map((s) => s.key))"
          :label="group.label"
          :ui="{ label: 'font-semibold text-highlighted' }"
          @update:model-value="(value) => toggleGroup(group.sections.map((s) => s.key), value === true)"
        />
        <div class="space-y-1 ps-6">
          <UCheckbox
            v-for="section in group.sections"
            :key="section.key"
            :model-value="isChecked(section.key)"
            :label="section.label"
            @update:model-value="(value) => toggle(section.key, value === true)"
          />
        </div>
      </fieldset>
    </div>
  </div>
</template>
