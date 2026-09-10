<script setup lang="ts">
import { useDepartmentApi } from '~~/services/api/department.api';
import type { Department } from '~~/services/types/department.type';
import { departmentSchema } from '~/schemas/department.schema';

interface Props {
  department?: Department;
}

const props = defineProps<Props>();
const emit = defineEmits<{ close: [boolean] }>();

const toast = useToast();
const departmentApi = useDepartmentApi();

const schema = departmentSchema;

const { entity: department, pending, notFound } = useModalEntity({
  prop: props.department,
  fetchById: (id) => departmentApi.getOneDepartment(id),
});

const isUpdate = computed(() => !!department.value);

const newDepartment = ref({
  title: '',
  slug: '',
  isDeleted: false,
});

watch(
  department,
  (value) => {
    if (!value) return;
    newDepartment.value = {
      title: value.title || '',
      slug: value.slug || '',
      isDeleted: value.isDeleted || false,
    };
  },
  { immediate: true }
);

const onSubmit = async () => {
  if (isUpdate.value && department.value) {
    await departmentApi.updateDepartment(department.value.id, newDepartment.value);
    toast.add({ title: 'Отдел обновлён' });
    emit('close', true);
    return;
  }

  const res = (await departmentApi.createDepartment(newDepartment.value)) as
    | { message?: string }
    | null;

  if (res?.message) {
    toast.add({ title: res.message, color: 'error' });
  } else {
    toast.add({ title: 'Отдел создан' });
    emit('close', true);
  }
};
</script>

<template>
  <UModal
    :title="isUpdate ? 'Редактирование отдела' : 'Создание отдела'"
    :description="
      isUpdate
        ? 'Измените параметры отдела'
        : 'Заполните информацию для нового отдела'
    "
    :dismissible="false"
  >
    <template #body>
      <div
        v-if="pending"
        class="flex items-center justify-center py-12"
      >
        <UIcon
          name="i-heroicons-arrow-path"
          class="w-6 h-6 animate-spin text-neutral-400"
        />
      </div>

      <div
        v-else-if="notFound"
        class="py-12 text-center text-neutral-500 dark:text-neutral-400"
      >
        Запись не найдена
      </div>

      <div v-else class="flex flex-col w-full">
        <UForm
          :schema="schema"
          :state="newDepartment"
          class="space-y-5"
          @submit="onSubmit"
        >
          <UFormField required name="title" label="Название">
            <UInput
              v-model="newDepartment.title"
              class="w-full"
              placeholder="Например: IT-отдел"
              icon="i-heroicons-building-office-20-solid"
              size="md"
            />
          </UFormField>

          <UFormField name="link" label="URL-адрес" description="">
            <UInput
              v-model="newDepartment.slug"
              class="w-full"
              placeholder="it-otdel"
              icon="i-heroicons-link-20-solid"
              size="md"
            />

            <p class="text-xs text-neutral-500 dark:text-neutral-400">
              Используется для формирования ссылки. Останется пустым — создастся
              автоматически
            </p>
          </UFormField>
          <UFormField label="Видимость">
            <div
              class="p-4 bg-neutral-50 dark:bg-neutral-800/50 rounded-xl border border-neutral-200 dark:border-neutral-700"
            >
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <UIcon
                    :name="
                      newDepartment.isDeleted
                        ? 'i-heroicons-eye-slash-20-solid'
                        : 'i-heroicons-eye-20-solid'
                    "
                    class="w-4 h-4"
                    :class="
                      newDepartment.isDeleted
                        ? 'text-neutral-500'
                        : 'text-green-500'
                    "
                  />
                  <p
                    class="text-sm font-medium text-neutral-900 dark:text-white"
                  >
                    {{ newDepartment.isDeleted ? 'Скрыт' : 'Активен' }}
                  </p>
                </div>
                <UCheckbox
                  v-model="newDepartment.isDeleted"
                  :label="newDepartment.isDeleted ? 'Скрыт' : 'Активен'"
                />
              </div>
            </div>
            <p class="text-xs text-neutral-500 dark:text-neutral-400">
              Скрытые отделы не отображаются в интерфейсе
            </p>
          </UFormField>
          <div
            class="flex items-center justify-end gap-3 pt-4 mt-2 border-t border-neutral-200 dark:border-neutral-700"
          >
            <UButton
              type="submit"
              color="primary"
              size="md"
              class="min-w-[120px]"
              :icon="
                isUpdate
                  ? 'i-heroicons-pencil-square-20-solid'
                  : 'i-heroicons-plus-20-solid'
              "
            >
              {{ isUpdate ? 'Обновить' : 'Создать' }}
            </UButton>
          </div>
        </UForm>
      </div>
    </template>
  </UModal>
</template>

<style scoped></style>
