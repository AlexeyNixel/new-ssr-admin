<template>
  <div class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
    <UCard>
      <div class="flex items-center justify-between">
        <div>
          <p class="text-sm font-medium text-gray-500">Всего пользователей</p>
          <p class="text-2xl font-bold">1,248</p>
          <p class="text-sm text-green-600">+12.5%</p>
        </div>
        <UIcon name="i-heroicons-users" class="w-8 h-8 text-blue-500" />
      </div>
    </UCard>

    <UCard>
      <div class="flex items-center justify-between">
        <div>
          <p class="text-sm font-medium text-gray-500">Заказы</p>
          <p class="text-2xl font-bold">356</p>
          <p class="text-sm text-green-600">+8.2%</p>
        </div>
        <UIcon
          name="i-heroicons-shopping-cart"
          class="w-8 h-8 text-green-500"
        />
      </div>
    </UCard>

    <UCard>
      <div class="flex items-center justify-between">
        <div>
          <p class="text-sm font-medium text-gray-500">Доход</p>
          <p class="text-2xl font-bold">$24,580</p>
          <p class="text-sm text-red-600">-3.4%</p>
        </div>
        <UIcon
          name="i-heroicons-currency-dollar"
          class="w-8 h-8 text-purple-500"
        />
      </div>
    </UCard>

    <UCard>
      <div class="flex items-center justify-between">
        <div>
          <p class="text-sm font-medium text-gray-500">Активность</p>
          <p class="text-2xl font-bold">89%</p>
          <p class="text-sm text-green-600">+2.1%</p>
        </div>
        <UIcon name="i-heroicons-chart-bar" class="w-8 h-8 text-orange-500" />
      </div>
    </UCard>
  </div>
</template>
