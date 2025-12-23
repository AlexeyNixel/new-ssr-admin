<template>
  <div class="p-5">
    <!-- Приветствие -->
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-gray-900">
        Добро пожаловать, {{ user.name }}!
      </h1>
      <p class="text-gray-600">Вот обзор вашей панели управления за сегодня</p>
    </div>

    <!-- Карточки статистики -->
    <StatsCards class="mb-6" />

    <!-- Основной контент -->
    <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <!-- График -->
      <UCard>
        <template #header>
          <h3 class="text-lg font-semibold">Статистика за неделю</h3>
        </template>
        <div class="h-64 flex items-center justify-center bg-gray-50 rounded">
          <p class="text-gray-500">График будет здесь</p>
        </div>
      </UCard>

      <!-- Последняя активность -->
      <RecentActivity />
    </div>

    <!-- Быстрые действия -->
    <UCard class="mt-6">
      <template #header>
        <h3 class="text-lg font-semibold">Быстрые действия</h3>
      </template>
      <div class="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <UButton
          v-for="action in quickActions"
          :key="action.label"
          :icon="action.icon"
          :color="action.color"
          variant="solid"
          class="flex-col h-auto py-4"
        >
          <template #default>
            <span class="mt-2 text-sm">{{ action.label }}</span>
          </template>
        </UButton>
      </div>
    </UCard>
  </div>
</template>

<script lang="ts" setup>
import StatsCards from '~/components/admin/StatsCards.vue';
import RecentActivity from '~/components/admin/RecentActivity.vue';

const authApi = useAuth();
const cookies = useCookie('user_data');
const user = computed(() => {
  return {
    name: cookies.value?.name || '',
    email: cookies.value?.username,
    role: 'Администратор',
    avatar: 'i-heroicons-user-circle',
  };
});
const quickActions = [
  {
    label: 'Добавить пользователя',
    icon: 'i-heroicons-user-plus',
    color: 'primary',
  },
  {
    label: 'Создать заказ',
    icon: 'i-heroicons-plus-circle',
    color: 'green',
  },
  {
    label: 'Экспорт данных',
    icon: 'i-heroicons-arrow-down-tray',
    color: 'blue',
  },
  {
    label: 'Настройки',
    icon: 'i-heroicons-cog',
    color: 'gray',
  },
];
</script>
