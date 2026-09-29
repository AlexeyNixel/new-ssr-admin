<template>
  <!-- Две колонки: основное содержимое + боковая панель параметров -->
  <div
    class="mx-auto grid max-w-7xl grid-cols-1 gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[minmax(0,1fr)_320px] xl:grid-cols-[minmax(0,1fr)_360px]"
  >
    <main class="min-w-0 space-y-6">
      <slot />
    </main>
    <aside class="min-w-0 space-y-4">
      <slot name="aside" />
    </aside>
  </div>
</template>
