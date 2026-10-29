# Раздел «Достижения» в админке

**Дата:** 2026-10-29
**Задача:** счётчики в блоке достижений на главной (`Achievement`: `label`, `count`)
правились только через БД — нужен раздел в админке.

## Что сделано

### Бэкенд (`backend/src/achievements`)

| Изменение | Файл |
|---|---|
| `GET /api/achievements/admin` — все счётчики, включая скрытые (под `JwtAuthGuard`) | `achievements.controller.ts` |
| `GET /api/achievements/:id` — для deep-link и модалки (под `JwtAuthGuard`) | там же |
| `@Section('games')` → `@Section('achievements')` — отдельный раздел, а не «Игры» | там же |
| Публичный `GET /api/achievements` остался без гарда и по-прежнему отдаёт только `isDeleted: false` | там же |
| `findAll` / `findAllAdmin` сортируют по `createdAt asc` — порядок счётчиков на сайте стабилен | `achievements.service.ts` |
| `findOne` и `update` бросают `NotFoundException`, а не 500 от Prisma | там же |
| `isDeleted` в `UpdateAchievementDto` — можно скрыть счётчик, не удаляя | `dto/update-achievement.dto.ts` |
| Новый ключ раздела `achievements` | `auth/sections.ts` |
| Починен битый импорт `./dto/create-achievement.dto` → `./create-achievement.dto` (ломал `update-achievement.dto.ts` и spec) | `dto/update-achievement.dto.ts` |

Миграция БД **не нужна**: новых полей и таблиц нет.

### Админка

| Что | Файл |
|---|---|
| Страница-список: подпись, значение, статус, дата, меню действий, создание | `app/pages/achievement/index.vue` |
| Модалка создания/редактирования + переключатель видимости | `app/components/Modals/AdminAchievement.vue` |
| Zod-схема: подпись 2–40 символов, значение — только число (`1200`, `12 000+`) | `app/schemas/achievement.schema.ts` |
| API-обёртка и тип | `services/api/achievement.api.ts`, `services/types/achievement.type.ts` |
| Эндпоинты | `services/endpoints.ts` |
| Пункт меню «Контент → Достижения» | `app/components/LayoutAside.vue` |
| Ключ раздела + шаблон доступа «Контент» | `app/constants/sections.ts` |
| Ссылка из журнала изменений (`/achievement?editId=…`) | `app/utils/auditLog.ts` |
| Строка в таблице deep-link | `docs/deep-links.md` |

Поведение:

- скрытый счётчик остаётся в админке и пропадает с главной;
- статус переключается кликом по бейджу (оптимистично, с откатом при ошибке);
- строка кликабельна, `?editId=` открывает модалку сразу;
- действия пишутся в журнал (`@Audited('Achievement')` уже был);
- `POST`/`PATCH` требуют раздел `achievements` (или полный доступ).

## Проверка

- `npx jest src/achievements --runInBand` — 2 теста прошли.
- `npx tsc --noEmit` по бэкенду — без ошибок (после `npx prisma generate`,
  клиент пересобран под модели, приехавшие с последним pull).
- `eslint` по новым и изменённым файлам бэкенда и админки — чисто.
- `nuxt build` / `nuxi typecheck` в песочнице не запускаются: `spawn EPERM`
  при попытке сборки (ограничение окружения, не код). Проверить локально:
  `npm run dev` в `frontend-admin` и открыть `/achievement`.

## Нюансы

- **Права:** раздел новый, поэтому у пользователей с явным списком `sections`
  (не `null`) галочку «Достижения» нужно поставить в «Пользователях» — иначе
  страница скрыта и API ответит 403.
- **Удаления нет:** как и у остальных сущностей, только скрытие. Жёсткое
  удаление счётчика вряд ли нужно, но если понадобится — `DELETE` в контроллере
  пока отсутствует.
- **Ссылка со счётчика:** фронт сайта умеет брать `url` у достижения
  (`frontend/app/components/Achievements.vue`), но в БД такого поля нет —
  админка его не редактирует. Если нужно вести счётчик на раздел, потребуется
  миграция `url String?`.
