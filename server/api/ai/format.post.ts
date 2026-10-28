import { AI_MODES, type AiModeId } from '~~/services/ai/prompts';

/**
 * Прокси к модели на ai.infomania.ru (нативный Ollama API, /api/chat).
 *
 * Зачем серверный роут, а не запрос из браузера напрямую:
 *  - токен авторизации хранится в приватном runtimeConfig и не попадает в клиент;
 *  - нет CORS: админка и этот роут на одном origin;
 *  - ответ модели (NDJSON) превращаем в простой поток текста для стриминга в UI.
 *
 * Тело запроса: { mode: AiModeId, text: string }
 * Ответ: text/plain поток — токены ответа модели по мере генерации.
 */
export default defineEventHandler(async (event) => {
  const { ai } = useRuntimeConfig();

  if (!ai?.token) {
    throw createError({ statusCode: 500, statusMessage: 'AI: токен не настроен (NUXT_AI_TOKEN)' });
  }

  const body = await readBody<{ mode?: string; text?: string }>(event);
  const text = (body?.text ?? '').toString().trim();
  const mode = AI_MODES[body?.mode as AiModeId] ? (body!.mode as AiModeId) : 'proofread';

  if (!text) {
    throw createError({ statusCode: 400, statusMessage: 'Пустой текст' });
  }
  // Защита от случайной отправки гигантского содержимого в маленькую модель
  if (text.length > 20000) {
    throw createError({ statusCode: 413, statusMessage: 'Слишком длинный текст (макс. 20000 символов)' });
  }

  const preset = AI_MODES[mode];

  const upstream = await fetch(`${ai.baseUrl.replace(/\/$/, '')}/api/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${ai.token}`,
    },
    body: JSON.stringify({
      model: ai.model,
      stream: true,
      think: false, // qwen3 поддерживает «размышления» — для форматирования они лишние и замедляют
      options: { temperature: preset.temperature },
      messages: [
        { role: 'system', content: preset.system },
        { role: 'user', content: text },
      ],
    }),
  });

  if (!upstream.ok || !upstream.body) {
    const detail = await upstream.text().catch(() => '');
    throw createError({
      statusCode: 502,
      statusMessage: `AI недоступен (${upstream.status})`,
      data: detail.slice(0, 500),
    });
  }

  setResponseHeader(event, 'Content-Type', 'text/plain; charset=utf-8');
  setResponseHeader(event, 'Cache-Control', 'no-cache');
  setResponseHeader(event, 'X-Accel-Buffering', 'no'); // не буферизовать на nginx — иначе стриминг «встаёт»

  const reader = upstream.body.getReader();
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();

  // Ollama отдаёт построчный NDJSON: { message: { content }, done }.
  // Вытаскиваем message.content и шлём клиенту как чистый текст.
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let buffer = '';
      const flushLine = (line: string) => {
        const trimmed = line.trim();
        if (!trimmed) return;
        try {
          const json = JSON.parse(trimmed);
          const chunk: string | undefined = json?.message?.content;
          if (chunk) controller.enqueue(encoder.encode(chunk));
        } catch {
          // частичная строка — игнорируем, дособерётся в buffer
        }
      };

      try {
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() ?? '';
          for (const line of lines) flushLine(line);
        }
        if (buffer) flushLine(buffer);
        controller.close();
      } catch (err) {
        controller.error(err);
      }
    },
  });

  return stream;
});
