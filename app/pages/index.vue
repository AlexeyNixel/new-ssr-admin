<!-- pages/admin/instructions.vue -->
<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <div class="container mx-auto px-4 py-8 max-w-5xl">
      <!-- Header -->
      <div class="mb-8 text-center">
        <h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          📘 Админ-панель: инструкции
        </h1>
        <p class="text-gray-600 dark:text-gray-400">
          Быстрое руководство по управлению ключевыми разделами сайта
        </p>
      </div>

      <!-- ==================== ИНСТРУКЦИЯ 1: УВЕДОМЛЕНИЯ ==================== -->
      <div id="notifications" class="mb-12 scroll-mt-4">
        <div class="flex items-center gap-3 mb-6">
          <div class="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
            <UIcon
              name="i-heroicons-bell"
              class="w-6 h-6 text-purple-600 dark:text-purple-400"
            />
          </div>
          <h2 class="text-2xl font-bold text-gray-900 dark:text-white">
            🔔 Управление уведомлениями
          </h2>
        </div>

        <UCard>
          <div class="space-y-6">
            <!-- Структура данных -->
            <div>
              <h3
                class="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3"
              >
                📋 Структура уведомления
              </h3>
              <div
                class="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 font-mono text-sm"
              >
                <pre class="text-gray-700 dark:text-gray-300"><code>{
  id: string           // Уникальный идентификатор
  title: string        // Заголовок уведомления
  description: string  // Текст уведомления
  postId: string       // ID связанной статьи (если есть)
  startTime: string    // Дата начала показа (ISO)
  endTime: string      // Дата окончания показа (ISO)
  type: 'error' | 'warning' | 'success'  // Тип: ошибка/предупреждение/успех
  isDeleted: boolean   // Мягкое удаление
}</code></pre>
              </div>
            </div>

            <!-- Пошаговая инструкция -->
            <div>
              <h3
                class="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4"
              >
                ➕ Как создать уведомление
              </h3>
              <ol
                class="list-decimal list-inside space-y-3 text-gray-700 dark:text-gray-300"
              >
                <li>
                  Перейдите в раздел
                  <UBadge color="purple">Уведомления → Создать</UBadge>
                </li>
                <li>
                  Заполните <strong>заголовок</strong> и
                  <strong>описание</strong> (обязательные поля)
                </li>
                <li>
                  Выберите <strong>тип уведомления</strong> в зависимости от
                  контекста:
                  <div class="mt-2 ml-6 space-x-2">
                    <UBadge color="red">error</UBadge> — для критических ошибок
                    <UBadge color="amber">warning</UBadge> — для предупреждений
                    <UBadge color="green">success</UBadge> — для успешных
                    операций
                  </div>
                </li>
                <li>
                  Установите <strong>период показа</strong> (startTime /
                  endTime)
                </li>
                <li>
                  Привяжите <strong>postId</strong> (опционально, если
                  уведомление относится к статье)
                </li>
                <li>
                  Нажмите <UBadge color="green">Сохранить</UBadge> — уведомление
                  появится на сайте в указанный период
                </li>
              </ol>
            </div>

            <!-- Пример интерфейса уведомления -->
            <div class="border-t dark:border-gray-700 pt-6">
              <p
                class="text-sm font-medium text-gray-600 dark:text-gray-400 mb-3"
              >
                Как выглядят уведомления на сайте:
              </p>
              <div class="space-y-3">
                <div
                  class="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 rounded-lg p-4"
                >
                  <div class="flex items-start gap-3">
                    <UIcon
                      name="i-heroicons-exclamation-circle"
                      class="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5"
                    />
                    <div>
                      <div class="font-semibold text-red-800 dark:text-red-300">
                        [error] Библиотека не работает в понедельник
                      </div>
                      <div class="text-sm text-red-700 dark:text-red-400">
                        Технический день
                      </div>
                    </div>
                  </div>
                </div>
                <div
                  class="bg-amber-50 dark:bg-amber-900/20 border-l-4 border-amber-500 rounded-lg p-4"
                >
                  <div class="flex items-start gap-3">
                    <UIcon
                      name="i-heroicons-clock"
                      class="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5"
                    />
                    <div>
                      <div
                        class="font-semibold text-amber-800 dark:text-amber-300"
                      >
                        [warning] Технические работы
                      </div>
                      <div class="text-sm text-amber-700 dark:text-amber-400">
                        Перерыв работы с 10:00 до 11:00
                      </div>
                    </div>
                  </div>
                </div>
                <div
                  class="bg-green-50 dark:bg-green-900/20 border-l-4 border-green-500 rounded-lg p-4"
                >
                  <div class="flex items-start gap-3">
                    <UIcon
                      name="i-heroicons-check-circle"
                      class="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5"
                    />
                    <div>
                      <div
                        class="font-semibold text-green-800 dark:text-green-300"
                      >
                        [success] Началась регистрация на турнир настольных игр
                      </div>
                      <div class="text-sm text-green-700 dark:text-green-400">
                        Вы можете пройти регистрацию на турнир на нашем сайте.
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Важные замечания -->
            <div
              class="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-4 border-l-4 border-amber-500"
            >
              <div class="flex items-start gap-2">
                <UIcon
                  name="i-heroicons-light-bulb"
                  class="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5"
                />
                <div class="text-sm">
                  <p class="font-medium text-amber-800 dark:text-amber-300">
                    ⚠️ Важные правила для уведомлений
                  </p>
                  <ul
                    class="list-disc list-inside mt-1 text-amber-700 dark:text-amber-400 space-y-1"
                  >
                    <li>
                      Уведомления с <strong>isDeleted = true</strong> не
                      отображаются на сайте (мягкое удаление)
                    </li>
                    <li>
                      Период показа проверяется по текущему времени:
                      <code class="bg-amber-100 dark:bg-amber-800 px-1 rounded"
                        >startTime ≤ now ≤ endTime</code
                      >
                    </li>
                    <li>
                      Если <strong>postId</strong> указан — уведомление
                      отображается только на странице этой статьи
                    </li>
                    <li>
                      При удалении статьи — связанные уведомления можно
                      автоматически скрыть или удалить
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </UCard>
      </div>

      <!-- ==================== ИНСТРУКЦИЯ 2: ГЛАВНЫЙ СЛАЙДЕР ==================== -->
      <div id="slider" class="mb-12 scroll-mt-4">
        <div class="flex items-center gap-3 mb-6">
          <div class="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
            <UIcon
              name="i-heroicons-photo"
              class="w-6 h-6 text-blue-600 dark:text-blue-400"
            />
          </div>
          <h2 class="text-2xl font-bold text-gray-900 dark:text-white">
            🎠 Управление главным слайдером
          </h2>
        </div>

        <UCard>
          <div class="space-y-6">
            <!-- Структура данных слайда -->
            <div>
              <h3
                class="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3"
              >
                📋 Структура слайда
              </h3>
              <div
                class="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 font-mono text-sm"
              >
                <pre class="text-gray-700 dark:text-gray-300"><code>{
  id: string           // Уникальный ID слайда
  slideOrder: number   // Порядок показа (сортировка)
  postId: string       // ID связанной статьи
  imageFileId: string  // ID файла изображения
  url: string          // Ссылка при клике на слайд
  image: File {        // Объект изображения
    id: string
    originalName: string
    mimeType: string
    path: string
    preview: string    // Превью изображения
    // ...
  }
  createdAt: string    // Дата создания
  isDeleted: boolean   // Мягкое удаление
}</code></pre>
              </div>
            </div>

            <!-- Пошаговая инструкция -->
            <div>
              <h3
                class="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4"
              >
                🖼️ Как добавить слайд в карусель
              </h3>
              <ol
                class="list-decimal list-inside space-y-3 text-gray-700 dark:text-gray-300"
              >
                <li>
                  Перейдите в раздел
                  <UBadge color="blue">Главный слайдер → Добавить слайд</UBadge>
                </li>
                <li>
                  Загрузите изображение через медиа-менеджер (поддерживаются
                  JPG, PNG, WEBP)
                </li>
                <li>
                  Укажите <strong>URL</strong>, куда перейдет пользователь при
                  клике на слайд
                </li>
                <li>
                  При необходимости свяжите слайд со статьей через
                  <strong>postId</strong>
                </li>
                <li>
                  Установите <strong>порядок показа (slideOrder)</strong>:
                  <div
                    class="mt-2 ml-6 text-sm text-gray-500 dark:text-gray-400"
                  >
                    ↳ Чем меньше число — тем раньше показывается слайд (1, 2,
                    3...)
                  </div>
                </li>
                <li>
                  Нажмите <UBadge color="green">Сохранить</UBadge> — слайд
                  появится на главной странице
                </li>
              </ol>
            </div>

            <!-- Таблица управления порядком слайдов -->
            <div>
              <div class="flex justify-between items-center mb-3">
                <h3
                  class="text-md font-semibold text-gray-800 dark:text-gray-200"
                >
                  📊 Список слайдов с управлением порядком
                </h3>
                <UButton size="xs" color="blue" variant="outline"
                  >+ Добавить слайд</UButton
                >
              </div>
              <div
                class="border dark:border-gray-700 rounded-lg overflow-hidden"
              >
                <table
                  class="min-w-full divide-y divide-gray-200 dark:divide-gray-700"
                >
                  <thead class="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th
                        class="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400"
                      >
                        Порядок
                      </th>
                      <th
                        class="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400"
                      >
                        Превью
                      </th>
                      <th
                        class="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400"
                      >
                        URL / postId
                      </th>
                      <th
                        class="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400"
                      >
                        Действия
                      </th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
                    <tr class="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td class="px-4 py-2">
                        <div class="flex items-center gap-1">
                          <UButton
                            icon="i-heroicons-chevron-up"
                            size="2xs"
                            color="gray"
                            variant="ghost"
                          />
                          <span class="text-sm">1</span>
                          <UButton
                            icon="i-heroicons-chevron-down"
                            size="2xs"
                            color="gray"
                            variant="ghost"
                          />
                        </div>
                      </td>
                      <td class="px-4 py-2">
                        <div
                          class="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded"
                        />
                      </td>
                      <td class="px-4 py-2 text-sm">/promo/new-year</td>
                      <td class="px-4 py-2">
                        <div class="flex gap-1">
                          <UButton
                            icon="i-heroicons-pencil"
                            size="2xs"
                            color="gray"
                            variant="ghost"
                          />
                          <UButton
                            icon="i-heroicons-trash"
                            size="2xs"
                            color="red"
                            variant="ghost"
                          />
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <!-- Важные замечания -->
            <div
              class="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border-l-4 border-blue-500"
            >
              <div class="flex items-start gap-2">
                <UIcon
                  name="i-heroicons-light-bulb"
                  class="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5"
                />
                <div class="text-sm">
                  <p class="font-medium text-blue-800 dark:text-blue-300">
                    💡 Рекомендации по слайдеру
                  </p>
                  <ul
                    class="list-disc list-inside mt-1 text-blue-700 dark:text-blue-400 space-y-1"
                  >
                    <li>
                      Изображения автоматически оптимизируются — загружайте в
                      высоком разрешении
                    </li>
                    <li>
                      Слайды с <strong>isDeleted = true</strong> не
                      отображаются, но остаются в БД
                    </li>
                    <li>
                      Если указан <strong>postId</strong>, слайд может вести на
                      страницу статьи (приоритетнее url?)
                    </li>
                    <li>
                      Рекомендуемый порядок: от 1 до 10, чтобы легко вставлять
                      новые слайды
                    </li>
                    <li>
                      Используйте <strong>slideOrder</strong> как поле для
                      сортировки в API:
                      <code class="bg-blue-100 dark:bg-blue-800 px-1 rounded"
                        >ORDER BY slideOrder ASC</code
                      >
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            <!-- Интеграция с файлами -->
            <div class="bg-gray-100 dark:bg-gray-800 rounded-lg p-4">
              <p
                class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                📁 Примечание о File
              </p>
              <p class="text-sm text-gray-600 dark:text-gray-400">
                Изображения хранятся в отдельной таблице <strong>File</strong>.
                Поле <code>imageFileId</code> связывает слайд с файлом. Доступ к
                изображению через <code>image.preview</code> или
                <code>image.path</code>. Поддерживаются форматы: JPG, PNG, WEBP,
                GIF.
              </p>
            </div>
          </div>
        </UCard>
      </div>

      <!-- Кнопка "Наверх" -->
      <div class="fixed bottom-6 right-6">
        <UButton
          icon="i-heroicons-arrow-up"
          color="gray"
          variant="solid"
          class="shadow-lg"
          @click="scrollToTop"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
// Функция для плавного скролла к топу
const scrollToTop = () => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
};
</script>

<style scoped>
.scroll-mt-4 {
  scroll-margin-top: 1rem;
}

pre code {
  white-space: pre-wrap;
  word-break: break-word;
}
</style>
