<script setup lang="ts">
import { useDepartmentApi } from '~~/services/api/department.api';
import type { Department } from '~~/services/types/department.type';

interface Props {
  department?: Department;
}

const props = defineProps<Props>();
const emit = defineEmits<{ close: [boolean] }>();

const isUpdate = ref(!!props.department);

const toast = useToast();
const departmentApi = useDepartmentApi();
const departmentStore = useDepartmentStore();

const newDepartment = ref({
  title: props.department?.title,
  slug: props.department?.slug,
  isDeleted: props.department?.isDeleted,
});

const handleCreate = async () => {
  if (isUpdate.value && props.department) {
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

  await departmentStore.getDepartments({
    isDeleted: true,
    limit: 15,
  });

  emit('close', false);
};
</script>

<template>
  <UModal title="Создание отдела" description="Отсутствует">
    <template #content>
      <div class="p-3 flex flex-col gap-5">
        <h3 v-if="isUpdate">Обновление отдела</h3>
        <h3 v-else>Создание отдела</h3>

        <UInput v-model="newDepartment.title" placeholder="Название" />
        <UInput v-model="newDepartment.slug" placeholder="Слаг" />
        <UCheckbox
          v-model="newDepartment.isDeleted"
          label="Скрыть"
          variant="card"
        />

        <UButton
          :label="isUpdate ? 'Обновить' : 'Создать'"
          @click="handleCreate"
        />
      </div>
    </template>
  </UModal>
</template>

<style scoped></style>
