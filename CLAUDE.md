# CLAUDE.md

Этот файл содержит инструкции для Claude Code при работе с этим репозиторием.

## О проекте

Админ-панель для сайта библиотеки **«НОМБ» (Infomania)**. Позволяет управлять
контентом сайта: новости (посты), статичные страницы, отделы, события, книги,
сборники книг, слайды главной страницы, пункты навигации, уведомления, теги,
клубы.

Бэкенд — отдельный API-проект (NestJS-подобный, judging by `/api/...`
эндпоинты), сюда не входит. Адрес API задаётся через
`NUXT_PUBLIC_API_BASE` (см. `.env`).

## Стек

- **Nuxt 4** (`compatibilityDate: 2025-07-15`), режим **SPA** (`ssr: false`)
- **@nuxt/ui v4** (Reka UI + Tailwind v4) — основная библиотека компонентов
- **Pinia** (`@pinia/nuxt`) — стейт-менеджмент (используется точечно)
- **VueUse** (`@vueuse/nuxt`)
- **dayjs-nuxt** — работа с датами
- **zod v4** — валидация форм
- **Tiptap** через `UEditor`/`UEditorToolbar` из @nuxt/ui — кастомный
  rich-text редактор (см. `app/components/Editor/`)
- **TypeScript**, ESLint (flat config через `@nuxt/eslint`), Prettier

## Команды

```bash
npm run dev       # дев-сервер (http://localhost:3000)
npm run build     # сборка
npm run generate  # статическая генерация
npm run preview   # предпросмотр сборки
```

Тестов в проекте нет. Перед коммитом достаточно убедиться, что dev-сервер
запускается и страница/фича рендерится без ошибок в консоли.

## Структура проекта и алиасы путей

Особенность проекта: каталог `services/` лежит **в корне репозитория**, а не
внутри `app/`.

```
app/                      # srcDir Nuxt (алиас ~/)
  components/
    Editor/                # кастомный Tiptap-редактор (UEditor)
    Modals/                # модалки CRUD для каждой сущности (AdminX.vue)
    Ui/                     # переиспользуемые поля форм (Upload*, Select*)
    LayoutAside.vue         # боковое меню админки
  composables/
    useAuth.ts              # авторизация (JWT в куках)
  constants/                # справочники (телефоны, места проведения)
  layouts/
    default.vue             # обёртка с LayoutAside
    table.vue               # обёртка для страниц-таблиц (заголовок, поиск, пагинация, кнопка "Создать")
  middleware/
    auth.global.ts           # глобальный редирект на /login
  pages/                     # файловый роутинг
  schemas/                   # zod-схемы валидации форм (*.schema.ts)
  stores/                    # Pinia-сторы (используются не везде)
  utils/
    uploadAdapter.ts          # legacy-адаптер загрузки для старого редактора (CKEditor) — вероятно неактуален

services/                  # ВНЕ app/, алиас ~~/services
  api/                       # composables useXApi() — обёртки над useApi()
  types/                     # TS-интерфейсы сущностей (*.type.ts)
  endpoints.ts               # карта API_ENDPOINTS
```

Импорт типов и API всегда через `~~/services/...`, импорт всего внутри `app/`
— через `~/...`.

## Архитектурные паттерны

### Слой API (`services/api/index.ts` → `useApi()`)

Общий composable с методами:

- `get<T>(endpoint, { params })` → `{ data, meta, status }` (пагинация)
- `getOne<T>(endpoint, slug, options?)` → `{ data, status }`
- `getWithoutPagination<T>(endpoint, options?)`
- `post(endpoint, data)`, `postMany(endpoint, data)`
- `postFile(endpoint, formData)` — загрузка файлов
- `patch(endpoint, id, data)`
- `login(user)`

Для каждой сущности — свой файл `services/api/<entity>.api.ts` с
`use<Entity>Api()`, который комбинирует `useApi()` + `API_ENDPOINTS.<entity>`.
Новые эндпоинты добавлять в `services/endpoints.ts`.

```ts
// пример: services/api/event.api.ts
export const useEventApi = () => {
  const api = useApi();
  return {
    getAllEvents: (params?: EventQuery) => api.get<IEvent[]>(API_ENDPOINTS.event, { params }),
    updateEvent: (id: string, data: any) => api.patch(API_ENDPOINTS.event, id, data),
    createEvent: (data: Partial<IEvent>) => api.post(API_ENDPOINTS.event, data),
  };
};
```

### Авторизация (`app/composables/useAuth.ts`)

- JWT хранится в куке `access_token`, данные пользователя — в `user_data`.
- `checkAuth()` декодирует токен (`jwt-decode`) и проверяет `exp`.
- `app/middleware/auth.global.ts` — глобальный мидлвар, редиректит на
  `/login`, если `isAuthenticated === false` и путь не `/login`.

### Страницы-списки + таблица (`layouts/table.vue`)

Стандартный паттерн для CRUD-страниц:

```vue
<NuxtLayout
  v-model="page"
  name="table"
  title="Управление отделами"
  :meta="response.meta"
  :event-create="handleOpenModal"
>
  <UTable :columns="columns" :data="response.data" />
</NuxtLayout>
```

- `v-model` — текущая страница пагинации, layout эмитит `update:modelValue`.
- `:meta` — объект `{ page, limit, total, hasPrev, hasNext }` из ответа API.
- `:event-create` — обработчик кнопки «Создать запись».
- Опционально `:search` + `@update:search` для поиска.

### Модальные окна CRUD (`app/components/Modals/AdminX.vue`)

Открываются через `useOverlay()`:

```ts
const overlay = useOverlay();
const modal = overlay.create(ModalsAdminDepartment); // авто-импорт по пути компонента

const handleOpenModal = async (department?: Department) => {
  const instance = modal.open({ department });
  const result = await instance.result;
  if (result) await fetchData(); // обновляем таблицу после сохранения
};
```

Сама модалка:

- `<UModal :dismissible="false" title="..." description="...">` — закрытие
  кликом вне модалки **запрещено намеренно** (см. коммит
  «Запрет закрытия модалки кликом вне окна модалки»).
- Внутри `<UForm :schema="schema" :state="newEntity" @submit="onSubmit">`,
  где `schema` — zod-схема из `app/schemas/<entity>.schema.ts`.
- По завершении `onSubmit` вызывается `emit('close', true)` — `true`
  сигнализирует родителю, что нужно перезагрузить список, и показывается
  `useToast()`.
- Состояние формы — `ref`/`reactive` объект, инициализированный из пропа
  (режим редактирования) либо дефолтами (режим создания); флаг
  `isUpdate = !!props.entity`.

При создании новой модалки/формы **копируй этот паттерн** (как в
`AdminDepartment.vue`, `AdminEvent.vue`, `AdminSlide.vue`,
`AdminNotification.vue`) — единый стиль вёрстки, отступов и кнопок уже
унифицирован для всех сущностей.

### Валидация (`app/schemas/*.schema.ts`)

Zod-схемы. Сообщения об ошибках — на русском. Частый паттерн «обрезать
пробелы и проверить минимальную длину»:

```ts
title: z.string('Обязательное поле').min(1, 'Обязательное поле')
  .transform((val) => val.trim())
  .pipe(z.string().min(8, 'Должно быть минимум 8 символов')),
```

Для soft-delete используется булево поле `isDeleted` (UI: бейдж
«Скрыта/Опубликована» или переключатель «Активен/Скрыт»).

### Загрузка изображений (`app/components/Ui/UploadImage.vue`)

`UiUploadImage` — обёртка над `UFileUpload`, при выборе файла грузит его
через `useUploadApi().uploadImage()` и эмитит `update:modelValue` с `id`
загруженного файла. Превью рендерится по адресу
`http://static.infomania.ru${path}` (см. «Известные особенности» ниже).

Аналогичные компоненты: `UploadDocument.vue`, `UploadExhibition.vue`.

### Rich-text редактор (`app/components/Editor/EditorCustom.vue`)

Используется компонент `UEditor`/`UEditorToolbar` из @nuxt/ui (на базе
Tiptap). Расширения: таблицы, картинки с ресайзом (с кастомным
`EditorImageUploadExtension`), `details/summary`, выравнивание текста,
кастомный `iframe`-нод. Подключается как `<EditorCustom v-model="...">` в
формы (поле `content`).

### Выбор связанных сущностей

`UiSelectTag` (`app/components/Ui/SelectTag.vue`) — `USelectMenu` с
возможностью создавать новый тег «на лету» (`create-item` + `@create`).
`UiSelectCollection` — аналогично для сборников книг.

## Стилизация / UI-конвенции

- Цветовая палитра определена через CSS-переменные `--color-primary-*` в
  `app/assets/css/main.css`.
- Глобальный стиль модалок задан в `app/app.config.ts`
  (`rounded-2xl shadow-2xl`, блюр оверлея) — не переопределяй точечно в
  каждой модалке.
- Весь пользовательский текст — **на русском языке**.
- Иконки — Heroicons/Lucide/Iconify через префиксы `i-heroicons-*`,
  `i-lucide-*`, `iconoir:*` и т.д.
- `app/assets/css/ck-content.css` — стили для отрендеренного контента
  редактора (legacy-название от CKEditor, сейчас используется с Tiptap).

## Окружение

- `.env` → `NUXT_PUBLIC_API_BASE` — базовый URL API (используется в
  `useApi()` через `runtimeConfig.public.apiBaseUrl`).
- В `nuxt.config.ts` настроены dev-прокси (`/site`, `/dev`, `/media`) на
  `http://192.168.0.41:10001` — внутренний адрес дев-бэкенда в локальной сети.

## Известные особенности / технический долг

Учитывай при рефакторинге рядом с этими местами, но не переписывай их
«заодно», если не просили:

- **`app/components/Modals/AdminClub.vue`** — недоделанная модалка (раздел
  «Клубы» только начат). Нет `UForm`, схемы валидации, обработчика
  сохранения и `emit('close')`. Обращается к `club.preview.path`, что
  упадёт при создании нового клуба (проп `club` обязателен, но при создании
  не передаётся). `useClubApi` содержит только `getAllClubs` — нет
  create/update.
- **Хардкод хостов**: `http://static.infomania.ru` в `UploadImage.vue` и
  `http://localhost:3300` + `http://static.infomania.ru` в
  `app/utils/uploadAdapter.ts` (похоже, не используется — legacy-адаптер для
  старого редактора). Ссылка `http://dev.infomania.ru/...` в
  `app/pages/page/index.vue`.
- **`app/pages/page/create.vue`** vs **`app/pages/page/admin/[[slug]].vue`**
  — похоже, `create.vue` устарел и заменён на универсальный
  `admin/[[slug]].vue` (создание/редактирование через optional catch-all).
  Перед использованием `create.vue` проверь, ссылается ли на него что-то.
- **`app/components/admin/RecentActivity.vue`** и **`StatsCards.vue`** —
  компоненты из стартового шаблона, нигде не используются.
- В `services/api/index.ts` есть отладочный `console.log(baseApi)` в
  `postFile`, в `services/api/department.api.ts` watcher с `console.log`.
- `useApi().get` глотает реальную ошибку и кидает строку
  `'Неправильный запрос'` — при дебаге сетевых ошибок смотри Network-таб, а
  не текст исключения.
- Местами есть закомментированный код (например, колонка `isDeleted` в
  `app/pages/club/index.vue`) — не удаляй автоматически, если не относится к
  задаче.
