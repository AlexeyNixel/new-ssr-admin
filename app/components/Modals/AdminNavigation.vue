<script setup lang="ts">
import type { NavigationItem } from '~~/services/types/navigation-item.type';
import { useNavigationApi } from '~~/services/api/navigation.api';

interface Props {
  navigationItem?: NavigationItem;
}

interface SelectItem {
  label: string;
  value: string;
}

const props = defineProps<Props>();

const navigationApi = useNavigationApi();

const newNavigationItem = ref({
  title: '',
  description: '',
  to: '',
  slug: '',
  icon: '',
  order: 0,
  isExternal: false,
  target: '',
  parentId: '',
});

const navItems = await navigationApi.getAllNavigationWithoutTree();

if (props.navigationItem) {
  Object.keys(newNavigationItem.value).forEach((key: string) => {
    newNavigationItem.value[key] = props.navigationItem[key];
  });
}

const search = ref('');
const items = ref<SelectItem[]>([
  {
    label: 'В новой вкладке',
    value: '_blank',
  },
  {
    label: 'В этой вкладке',
    value: '_self',
  },
]);

const onSubmit = async () => {
  console.log(newNavigationItem.value);
  if (props.navigationItem) {
    await navigationApi.update(
      props.navigationItem.id,
      newNavigationItem.value
    );
    console.log(newNavigationItem.value);
  } else {
    await navigationApi.create(newNavigationItem.value);
  }
};
</script>

<template>
  <UModal :dismissible="false">
    <template #content>
      <div class="p-6">
        <!-- Заголовок -->
        <div class="mb-6">
          <h3 class="text-xl font-semibold text-gray-900 dark:text-white">
            {{ navigationItem?.id ? 'Обновить запись' : 'Создать запись' }}
          </h3>
          <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {{
              navigationItem?.id
                ? 'Внесите изменения в существующую запись'
                : 'Заполните все обязательные поля для создания новой записи'
            }}
          </p>
        </div>

        <!-- Форма -->
        <UForm class="space-y-6" :on-submit="onSubmit">
          <!-- Основные поля -->
          <div class="space-y-4">
            <UFormField label="Название" name="title" required>
              <UInput
                v-model="newNavigationItem.title"
                placeholder="Введите название записи"
                class="w-full"
                size="lg"
              />
            </UFormField>

            <UFormField label="Описание" name="description" required>
              <UTextarea
                v-model="newNavigationItem.description"
                placeholder="Введите описание записи"
                class="w-full"
                :rows="3"
              />
            </UFormField>

            <UFormField label="Ссылка" name="link" required>
              <UInput
                v-model="newNavigationItem.to"
                placeholder="https://example.com"
                class="w-full"
                icon="i-heroicons-link"
              />
            </UFormField>

            <UFormField label="Родительский элемент" name="link" required>
              <USelectMenu
                v-model="newNavigationItem.parentId"
                v-model:search-term="search"
                :items="navItems"
                label-key="title"
                value-key="id"
                placeholder="Выберите родительский элемент если он есть"
                class="w-full"
                icon="i-heroicons-link"
              />
            </UFormField>
          </div>

          <!-- Группа полей в строку -->
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <!-- Тип открытия ссылки -->
            <UFormField label="Тип открытия ссылки" name="target" required>
              <USelect
                v-model="newNavigationItem.target"
                :items="items"
                placeholder="Выберите тип"
                class="w-full"
              />
            </UFormField>

            <!-- Иконка -->
            <UFormField label="Иконка" name="icon" required>
              <div class="space-y-2">
                <div
                  class="flex items-center gap-3 p-2 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
                >
                  <Icon
                    :name="newNavigationItem.icon"
                    class="text-lg text-gray-600 dark:text-gray-300"
                  />
                  <UInput
                    v-model="newNavigationItem.icon"
                    placeholder="icon-name"
                    class="flex-1 border-0 bg-transparent focus:ring-0 p-0"
                  />
                </div>
                <p class="text-xs text-gray-500 dark:text-gray-400">
                  Введите название иконки из Iconify
                </p>
              </div>
            </UFormField>

            <!-- Позиция -->
            <UFormField label="Позиция" name="position" required>
              <UInput
                v-model="newNavigationItem.order"
                type="number"
                placeholder="0"
                min="0"
                class="w-full"
              />
            </UFormField>
          </div>

          <!-- Разделитель -->
          <div class="border-t border-gray-200 dark:border-gray-700 pt-6">
            <!-- Кнопки действий -->
            <div class="flex justify-end gap-3">
              <UButton variant="outline" color="neutral" class="px-6">
                Отмена
              </UButton>
              <UButton color="primary" class="px-6" type="submit">
                {{ navigationItem?.id ? 'Обновить' : 'Создать' }}
              </UButton>
            </div>
          </div>
        </UForm>
      </div>
    </template>
  </UModal>
</template>

<style scoped>
/* Дополнительные кастомные стили если нужно */
</style>
