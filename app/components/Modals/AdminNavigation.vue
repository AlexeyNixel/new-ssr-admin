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
  <UModal
    :title="
      navigationItem?.id
        ? 'Редактирование записи навигации'
        : 'Создание записи навигации'
    "
    :description="
      navigationItem?.id
        ? 'Внесите изменения в существующую запись'
        : 'Заполните все обязательные поля для создания новой записи'
    "
    :dismissible="false"
  >
    <template #body>
      <div class="flex flex-col w-full">
        <UForm class="space-y-5" @submit="onSubmit">
          <!-- Основные поля -->
          <UFormField label="Название" name="title" required>
            <UInput
              v-model="newNavigationItem.title"
              placeholder="Введите название записи"
              icon="i-heroicons-text-20-solid"
              size="md"
              class="w-full"
            />
          </UFormField>

          <UFormField label="Описание" name="description" required>
            <UTextarea
              v-model="newNavigationItem.description"
              placeholder="Введите описание записи"
              class="w-full"
              :rows="3"
              size="md"
            />
          </UFormField>

          <UFormField label="Ссылка" name="link" required>
            <UInput
              v-model="newNavigationItem.to"
              placeholder="https://example.com"
              class="w-full"
              icon="i-heroicons-link"
              size="md"
            />
          </UFormField>

          <UFormField label="Родительский элемент" name="parentId">
            <USelectMenu
              v-model="newNavigationItem.parentId"
              v-model:search-term="search"
              :items="navItems"
              label-key="title"
              value-key="id"
              placeholder="Выберите родительский элемент если он есть"
              class="w-full"
              icon="i-heroicons-folder-20-solid"
            />
            <p class="text-xs text-neutral-500 dark:text-neutral-400">
              Если элемент является корневым, оставьте поле пустым
            </p>
          </UFormField>

          <!-- Группа полей в строку -->
          <div class="grid grid-cols-1 md:grid-cols-3 gap-5">
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
            <UFormField label="Иконка" name="icon">
              <div class="space-y-2">
                <div class="flex items-center gap-2">
                  <div
                    class="p-2 bg-neutral-50 dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700"
                  >
                    <Icon
                      :name="
                        newNavigationItem.icon ||
                        'i-heroicons-question-mark-circle-20-solid'
                      "
                      class="text-lg text-neutral-600 dark:text-neutral-300"
                    />
                  </div>
                  <UInput
                    v-model="newNavigationItem.icon"
                    placeholder="i-heroicons-home"
                    class="flex-1"
                    size="md"
                  />
                </div>
                <p class="text-xs text-neutral-500 dark:text-neutral-400">
                  Введите название иконки из Iconify (например:
                  i-heroicons-home)
                </p>
              </div>
            </UFormField>

            <!-- Позиция -->
            <UFormField label="Позиция" name="position">
              <UInput
                v-model="newNavigationItem.order"
                type="number"
                placeholder="0"
                min="0"
                class="w-full"
                icon="i-heroicons-bars-3-20-solid"
                size="md"
              />
              <p class="text-xs text-neutral-500 dark:text-neutral-400">
                Чем меньше число, тем выше в списке
              </p>
            </UFormField>
          </div>

          <!-- Кнопки действий -->
          <div
            class="flex items-center justify-end gap-3 pt-4 mt-2 border-t border-neutral-200 dark:border-neutral-700"
          >
            <UButton
              type="submit"
              color="primary"
              size="md"
              class="min-w-[120px]"
              :icon="
                navigationItem?.id
                  ? 'i-heroicons-pencil-square-20-solid'
                  : 'i-heroicons-plus-20-solid'
              "
            >
              {{ navigationItem?.id ? 'Обновить' : 'Создать' }}
            </UButton>
          </div>
        </UForm>
      </div>
    </template>
  </UModal>
</template>
