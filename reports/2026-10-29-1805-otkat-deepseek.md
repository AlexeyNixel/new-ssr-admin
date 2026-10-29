# Откат подключения DeepSeek: остаёмся на Ollama

**Дата:** 2026-10-29
**Задача:** убрать поддержку внешнего API (DeepSeek) и вернуть прежнюю схему —
только `qwen3:1.7b` на своём Ollama.

## Что откатили

| Файл | Действие |
|---|---|
| `server/utils/llm.ts` | удалён (слой провайдеров) |
| `server/utils/guard.ts` | удалён (проверка сессии на `/api/ai/*`) |
| `docs/ai.md` | удалён (инструкция по провайдерам) |
| `reports/2026-10-29-1720-ai-provider-deepseek.md` | удалён (описывал откаченное) |
| `nuxt.config.ts` | возвращён к HEAD: `ai.baseUrl` / `token` / `model` / `embedModel`, без `provider`/`apiKey`/`ollama` |
| `.env.example` | возвращён к HEAD: только `NUXT_AI_*` для Ollama |
| `server/utils/ollama.ts` | возвращён к HEAD: `ollamaChat` и `ollamaEmbed` как раньше |
| `server/api/ai/tags/placement.post.ts` | возвращён к HEAD (`ollamaChat`) |
| `server/api/ai/tags/themes.post.ts` | возвращён к HEAD (без вызова guard) |
| `server/api/ai/format.post.ts` | возвращён к HEAD, **поверх заново добавлены только правила про фото** (см. ниже) |

## Что осталось от следующей задачи (намеренно)

Обработка картинок при ИИ-генерации к провайдеру не относится и продолжает работать
на Ollama:

- `app/utils/aiImages.ts` — метки `[[ФОТО n]]`, возврат исходного HTML картинок;
- `EditorAiPopover.vue` — захват фото, предпросмотр и вставка с картинками;
- `services/ai/prompts.ts` — `AI_IMAGE_RULES` и `AI_IMAGE_MARKER_RE`;
- `format.post.ts` — единственное, что осталось от моего изменения: если в тексте
  есть метки фото, к системному промпту добавляются правила.

## Последствия

- Роуты `/api/ai/*` снова **без проверки сессии** — как было до подключения API.
  Для своего Ollama это лишь риск нагрузить сервер, но если понадобится, проверку
  можно вернуть отдельным небольшим коммитом (файл `guard.ts` + три вызова).
- В Dokploy, если переменные DeepSeek уже добавлены, их можно удалить
  (`NUXT_AI_PROVIDER`, `NUXT_AI_API_KEY`, `NUXT_AI_BASE_URL=https://api.deepseek.com`,
  `NUXT_AI_MODEL=deepseek-chat`) — код их больше не читает. После отката нужен
  редеплой админки.
- Если `NUXT_AI_MODEL` в проде меняли на `deepseek-chat`, вернуть `qwen3:1.7b`,
  иначе Ollama ответит 404 на неизвестную модель.

## Проверка

- `eslint` по `server/**`, `aiImages.ts`, `EditorAiPopover.vue`, `prompts.ts`,
  `nuxt.config.ts` — ошибок нет (осталось прежнее предупреждение `vue/no-v-html`
  на предпросмотре).
- `tsc -p .nuxt/tsconfig.server.json --noEmit` — без ошибок.
- Поиск по репозиторию `deepseek|NUXT_AI_API_KEY|aiChatStream|requireAdminSession` —
  совпадений нет.
