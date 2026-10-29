# Аудит админки: статус после pull

**Дата:** 2026-10-29 (обновлено после `git pull` в 16:27)
**Что это:** сверка моего аудита от 16:10 с кодом, который приехал коммитами
от 2026-10-27/28. Первая версия отчёта описывала состояние **до** pull —
её выводы ниже перепроверены построчно.

## Пришедшие коммиты

| Репозиторий | HEAD | Ключевое |
|---|---|---|
| backend | `35e1f16` Подключение собственной llm | 68 файлов, +2790 |
| frontend-admin | `d52b206` Исправление тэгов | 76 файлов, +4771 |
| frontend | `b8cec56` Фикс выставок | переезд на Silo, выставки, чистка |

Темы: ограничение админки и роли, переезд на Silo, отзывы об ошибках,
фикс уведомлений, подключение своей LLM (Ollama), QR для коротких ссылок,
больше подсказок в тексте.

## Что закрыто (мои рекомендации → факт в коде)

| Мой пункт | Что появилось | Файлы |
|---|---|---|
| **Открытая регистрация, нет ролей** | `register` под `JwtAuthGuard` + `UserManagerGuard`; список администраторов в коде (`slip`, `mgairat`); у пользователя `sections` (`null` = все); `@Section('books')` на маршрутах | `backend/src/auth/auth.controller.ts`, `src/user/user-managers.ts`, `src/auth/sections.ts` |
| **Пользователи и права** | Страница `/user`: создание, блокировка (`isBlocked` действует сразу), выдача разделов | `pages/user/index.vue`, `Modals/AdminUser.vue` |
| **`JWT_SECRET` с fallback** | Fallback убран, только `configService.get('JWT_SECRET')` | `backend/src/auth/auth.module.ts:14` |
| **Анонимная загрузка выставок** | `@Section('exhibitions')` + `JwtAuthGuard` + аудит | `backend/src/files/files.controller.ts` |
| **Медиатека** | `/media`: поиск, фильтры типа и «не используется», просмотр связей, удаление с подтверждением; бэкенд удаляет только неиспользуемый файл своего бакета | `pages/media/index.vue`, `backend/src/files/media.service.ts` |
| **Проверка битых ссылок** | `/link-check`: обход sitemap + ссылок из текстов, отчёты в БД, еженедельный фон на проде | `pages/link-check/index.vue`, `backend/src/link-check/` |
| **Журнал изменений (страница)** | `/audit-log` с фильтрами по автору, типу и периоду (`today`/`week`/…), `GET /audit-log/authors` | `pages/audit-log/index.vue`, `backend/src/audit-log/audit-log.controller.ts` |
| **Статистика коротких ссылок** | `short_link_clicks` (сутки по Новосибирску), `GET /short-link/:id/stats?days=30`, модалка со статистикой | `backend/src/short-link/`, `Modals/AdminShortLinkStats.vue` |
| **QR-коды** | `buildQrSvg`/PNG с логотипом в центре, пункт «Статистика и QR-код» в меню строки | `app/utils/qrCode.ts`, `pages/short-link/index.vue` |
| **Выставки** | Отдельный раздел `/exhibition`, загрузка ZIP + обложка, `isHidden`, публичный и админский списки | `pages/exhibition/index.vue`, `backend/src/files/exhibitions.service.ts` |
| **Удаление в API** | В `useApi()` появился `del()`, медиатека им уже пользуется | `services/api/index.ts:92` |
| **Хардкод static-хоста** | `staticUrl()` поверх `STATIC_HOST`, переезд на Silo (`s3.infomania.ru`) | `app/utils/listFormat.ts`, `nuxt.config.ts` |

Плюс две фичи, которых в моём списке не было: **«Ошибки и пожелания»**
(`/feedback`, вотчер с тостами, роли `FEEDBACK_MANAGERS`) и **ИИ-подсказки**
через свою Ollama (теги, форматирование текста).

Итого: закрыты почти весь блок безопасности, медиатека, проверка ссылок,
журнал, QR и статистика ссылок, выставки, пользователи. Это ровно те пункты,
которые я ставил в P0/P1/P2.

## Что осталось (перепроверено в новом коде)

| Проблема | Где сейчас | Комментарий |
|---|---|---|
| **`PATCH /api/tags/:id` — заглушка** | `backend/src/tags/tags.service.ts:68` | По-прежнему `This action updates a #…`. Страница `/tag` — только чтение; коммит «Исправление тэгов» правил подсказки, а не CRUD |
| **`GET /api/notification/:id` отсутствует** | `backend/src/notification/notification.controller.ts` | Есть `@Get()`, `@Post()`, `@Patch(':id')`, `@Delete(':id')` — но не `@Get(':id')`. Deep-link `/notification?editId=…` всё ещё даёт 404 |
| **`GET /api/main-slider/:id` — заглушка** | `backend/src/main-slider/main-slider.service.ts:66` | `findOne(id: number)` возвращает строку `This action returns a #…`; админка обходит перебором страниц |
| **Пагинация клубов** | `pages/club/index.vue:12-18` | `page` объявлен и связан с layout, но в запрос не уходит: всегда `limit: 20` без `page` |
| **Координаты точки карты** | `Modals/AdminMapPoint.vue:65-66` | `split(', ')` — «55.7,83.2» без пробела даёт `NaN`; `catch` в `onSubmit` так и нет |
| **Удаление контента** | `pages/post`, `page`, `event`, `book`, … | `del()` в API есть, но использует его только медиатека. У сущностей с `isDeleted` кнопки удаления нет |
| ~~**Достижения без UI**~~ | `/achievement` | **Сделано 2026-10-29**: раздел «Достижения» (см. отчёт `2026-10-29-1650-achievements-admin.md`) |
| **Deep-link при SPA-переходе** | `app/composables/useModalRouteOpener.ts` | `route.query` читается один раз при инициализации, `watch` не добавлен — баг из отчёта 22.09 жив |
| **Массовые действия** | все списки | `selectedRows`/checkbox не появились |
| **«Открыть на сайте» из редактора** | `EntityFormHeader` | Ссылка только в сайдбаре (`LayoutAside.vue:220`) |
| **Аудит без diff и без удалений** | `model AuditLog`, `enum AuditAction` | Поля «что изменилось» нет, `AuditAction` = только `CREATE`/`UPDATE` |
| **Нет `ValidationPipe` и троттлинга** | `backend/src/main.ts`, `package.json` | Глобальной валидации DTO, `@nestjs/throttler` и `helmet` по-прежнему нет |

Короткие ссылки: появились статистика и QR, но **удаления всё ещё нет** —
в контроллере только `POST`, `GET`, `GET :id/stats`, `GET :id`, `PATCH :id`,
скрытие через `isDeleted` остаётся единственным способом убрать ссылку.

## Приоритет на сейчас

1. **Пять мелких багов, по дню на всё:** теги (`PATCH`), `GET /notification/:id`,
   `GET /main-slider/:id`, пагинация клубов, координаты точек карты.
2. **Удаление контента:** `del()` уже есть — нужны кнопки с подтверждением и
   решение по каскадам (что делать со связями `TagsOnPosts`, `GenresOnGames`).
3. ~~**Достижения:** самый дешёвый новый экран (модель из двух полей, API готов).~~ — сделано 2026-10-29.
4. **Deep-link:** один `watch` в `useModalRouteOpener` — чинит все модалки сразу.
5. Дальше — diff в журнале, массовые действия, «Открыть на сайте»,
   `ValidationPipe` + троттлинг логина.

## Что из первой версии отчёта уже неактуально

Роли и ограничение доступа, закрытая регистрация, медиатека, проверка ссылок,
страница журнала, QR и статистика коротких ссылок, выставки, пользователи,
удаление в API, хардкод static-хоста — всё это сделано. Раздел «Безопасность»
первой версии закрыт примерно на две трети: остались только глобальная
валидация, троттлинг и содержимое аудита.
