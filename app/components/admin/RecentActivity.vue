<template>
  <UCard>
    <template #header>
      <div class="flex items-center justify-between">
        <h3 class="text-lg font-semibold">Последняя активность</h3>
        <UButton label="Смотреть все" variant="ghost" size="sm" />
      </div>
    </template>

    <div class="space-y-4">
      <div
        v-for="activity in activities"
        :key="activity.id"
        class="flex items-start space-x-3"
      >
        <UAvatar :src="activity.avatar" size="sm" />
        <div class="flex-1">
          <p class="text-sm">
            <span class="font-medium">{{ activity.user }}</span>
            {{ activity.action }}
          </p>
          <p class="text-xs text-gray-500">{{ activity.time }}</p>
        </div>
        <UBadge :color="activity.statusColor" size="sm">
          {{ activity.status }}
        </UBadge>
      </div>
    </div>
  </UCard>
</template>

<script setup lang="ts">
const activities = [
  {
    id: 1,
    user: 'Алексей Иванов',
    action: 'создал новый заказ',
    time: '10 минут назад',
    status: 'Завершено',
    statusColor: 'green',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex',
  },
  {
    id: 2,
    user: 'Мария Петрова',
    action: 'обновила профиль',
    time: '30 минут назад',
    status: 'В процессе',
    statusColor: 'blue',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Maria',
  },
  {
    id: 3,
    user: 'Иван Сидоров',
    action: 'добавил комментарий',
    time: '1 час назад',
    status: 'Ожидает',
    statusColor: 'yellow',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ivan',
  },
];
</script>
