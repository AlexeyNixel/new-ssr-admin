<script setup lang="ts">
import { useDepartmentApi } from '~~/services/api/department.api';
import type { Department } from '~~/services/types/department.type';
import { z } from 'zod';

interface Props {
  department?: Department;
}

const props = defineProps<Props>();
const emit = defineEmits<{ close: [boolean] }>();

const isUpdate = ref(!!props?.department);

const toast = useToast();
const departmentApi = useDepartmentApi();
const departmentStore = useDepartmentStore();

const schema = z.object({
  title: z.string('Обязательное поле'),
});

const newDepartment = ref({
  title: props.department?.title,
  slug: props.department?.slug,
  isDeleted: props.department?.isDeleted,
});

const handleCreate = async () => {
  console.log();
  if (isUpdate.value) {
    await departmentApi.updateDepartment(
      props.department.id,
      newDepartment.value
    );
  } else {
    await departmentApi.createDepartment(newDepartment.value);
  }

  toast.add({
    title: 'Отдел создан',
  });

  emit('close', false);
};
</script>

<template>
  <UModal title="Создание отдела" description="Отсутствует">
    <template #content>
      <UForm
        :schema="schema"
        :state="newDepartment"
        class="p-3 flex flex-col gap-5"
        @submit="handleCreate"
      >
        {{ !!department }}
        <h3 v-if="isUpdate">Обновление отдела</h3>
        <h3 v-else>Создание отдела</h3>

        <UFormField required label="Название" name="title">
          <UInput
            v-model="newDepartment.title"
            class="w-full"
            placeholder="Название"
          />
        </UFormField>

        <UFormField label="URL-адрес" name="slug">
          <UInput
            v-model="newDepartment.slug"
            class="w-full"
            placeholder="Слаг"
          />
        </UFormField>

        <UCheckbox
          v-model="newDepartment.isDeleted"
          label="Скрыть"
          variant="card"
        />

        <UButton :label="isUpdate ? 'Обновить' : 'Создать'" type="submit" />
      </UForm>
    </template>
  </UModal>
</template>

<style scoped></style>
