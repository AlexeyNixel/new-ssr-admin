<script setup lang="ts">
import type { NavigationItem } from '~~/services/types/navigation-item.type';
import { useNavigationApi } from '~~/services/api/navigation.api';
import { navigationSchema } from '~/schemas/navigation.schema';
import { NAV_ICON_PRESETS } from '~/constants/nav-icons';

interface Props {
  navigationItem?: NavigationItem;
  parentId?: string;
}

interface SelectItem {
  label: string;
  value: string;
}

const props = defineProps<Props>();
const emit = defineEmits<{ close: [boolean] }>();

const navigationApi = useNavigationApi();
const toast = useToast();

const { entity: navigationItem, pending, notFound } = useModalEntity({
  prop: props.navigationItem,
  fetchById: (id) => navigationApi.getOneNavigation(id),
});
const isUpdate = computed(() => !!navigationItem.value);

const newNavigationItem = ref({
  title: '',
  description: '',
  to: '',
  icon: '',
  target: '_self',
  parentId: props.parentId ?? '',
});

const navItems = await navigationApi.getAllNavigationWithoutTree();

watch(
  navigationItem,
  (value) => {
    if (!value) return;
    newNavigationItem.value = {
      title: value.title ?? '',
      description: value.description ?? '',
      to: value.to ?? '',
      icon: value.icon ?? '',
      target: value.target || '_self',
      parentId: value.parentId ?? '',
    };
  },
  { immediate: true }
);

const parentOptions = computed(() =>
  navItems.filter((item) => item.id !== navigationItem.value?.id)
);

const targetOptions = ref<SelectItem[]>([
  { label: 'В этой вкладке', value: '_self' },
  { label: 'В новой вкладке', value: '_blank' },
]);

const showIconPicker = ref(false);

const pickIcon = (icon: string) => {
  newNavigationItem.value.icon = icon;
  showIconPicker.value = false;
};

const clearIcon = () => {
  newNavigationItem.value.icon = '';
};

const onSubmit = async () => {
  const parentId = newNavigationItem.value.parentId || '';

  if (isUpdate.value && navigationItem.value) {
    await navigationApi.update(navigationItem.value.id, newNavigationItem.value);
  } else {
    const siblings = navItems.filter(
      (item) => (item.parentId ?? '') === parentId
    ).length;
    await navigationApi.create({
      ...newNavigationItem.value,
      order: siblings + 1,
    });
  }

  toast.add({ title: isUpdate.value ? 'Запись обновлена' : 'Запись создана' });
  emit('close', true);
};
</script>

<template>
  <UModal
    :title="
      isUpdate ? 'Редактирование записи навигации' : 'Создание записи навигации'
    "
    :description="
      isUpdate
        ? 'Внесите изменения в существующую запись'
        : 'Заполните обязательные поля для новой записи меню'
    "
    :dismissible="false"
  >
    <template #body>
      <div v-if="pending" class="flex items-center justify-center py-12">
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
          :schema="navigationSchema"
          :state="newNavigationItem"
          class="space-y-5"
          @submit="onSubmit"
        >
          <UFormField label="Название" name="title" required>
            <UInput
              v-model="newNavigationItem.title"
              placeholder="Например: О библиотеке"
              icon="i-heroicons-text-20-solid"
              size="md"
              class="w-full"
            />
          </UFormField>

          <UFormField label="Ссылка" name="to" required>
            <UInput
              v-model="newNavigationItem.to"
              placeholder="/about или https://example.com"
              class="w-full"
              icon="i-heroicons-link"
              size="md"
            />
            <p class="text-xs text-neutral-500 dark:text-neutral-400">
              Внутренний путь (начиная с /) или полный внешний адрес
            </p>
          </UFormField>

          <UFormField label="Описание" name="description">
            <UTextarea
              v-model="newNavigationItem.description"
              placeholder="Короткое пояснение к пункту (необязательно)"
              class="w-full"
              :rows="2"
              size="md"
            />
          </UFormField>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
            <UFormField label="Родительский пункт" name="parentId">
              <USelectMenu
                v-model="newNavigationItem.parentId"
                :items="parentOptions"
                label-key="title"
                value-key="id"
                placeholder="— Верхний уровень —"
                class="w-full"
                icon="i-heroicons-folder-20-solid"
              />
              <p class="text-xs text-neutral-500 dark:text-neutral-400">
                Пусто — пункт верхнего уровня
              </p>
            </UFormField>

            <UFormField label="Открывать ссылку" name="target" required>
              <USelect
                v-model="newNavigationItem.target"
                :items="targetOptions"
                class="w-full"
              />
            </UFormField>
          </div>

          <UFormField label="Иконка" name="icon">
            <div class="flex items-center gap-2">
              <UPopover v-model:open="showIconPicker">
                <UButton
                  color="neutral"
                  variant="outline"
                  size="md"
                  :icon="newNavigationItem.icon || 'i-heroicons-square-2-stack'"
                  square
                  aria-label="Выбрать иконку"
                />

                <template #content>
                  <div class="p-2 grid grid-cols-8 gap-1 w-[320px]">
                    <UButton
                      v-for="icon in NAV_ICON_PRESETS"
                      :key="icon"
                      :icon="icon"
                      color="neutral"
                      :variant="
                        newNavigationItem.icon === icon ? 'subtle' : 'ghost'
                      "
                      square
                      size="sm"
                      @click="pickIcon(icon)"
                    />
                  </div>
                </template>
              </UPopover>

              <UInput
                v-model="newNavigationItem.icon"
                placeholder="i-heroicons-home"
                class="flex-1"
                size="md"
              />

              <UButton
                v-if="newNavigationItem.icon"
                color="neutral"
                variant="ghost"
                size="xs"
                icon="i-heroicons-x-mark"
                square
                aria-label="Очистить иконку"
                @click="clearIcon"
              />
            </div>
            <p class="text-xs text-neutral-500 dark:text-neutral-400">
              Выберите из списка или введите имя иконки Iconify вручную
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
