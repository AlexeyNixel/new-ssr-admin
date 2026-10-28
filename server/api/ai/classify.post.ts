/**
 * Классификация текста по закрытому списку вариантов (теги, категория и т.п.).
 *
 * Ключевая гарантия: что бы модель ни вернула, ответ пересекается с переданным
 * списком `options` на сервере — наружу уходят только реально существующие
 * варианты. Поэтому даже слабая локальная модель не может «придумать» тег.
 *
 * Тело запроса: { text: string, options: string[], multiple?: boolean }
 * Ответ: { selected: string[] } — подмножество options (в их исходном написании).
 */
export default defineEventHandler(async (event) => {
  const { ai } = useRuntimeConfig();

  if (!ai?.token) {
    throw createError({ statusCode: 500, statusMessage: 'AI: токен не настроен (NUXT_AI_TOKEN)' });
  }

  const body = await readBody<{ text?: string; options?: string[]; multiple?: boolean }>(event);
  const text = (body?.text ?? '').toString().trim();
  const options = Array.isArray(body?.options)
    ? body!.options.map((o) => String(o).trim()).filter(Boolean)
    : [];
  const multiple = body?.multiple !== false;

  if (!text) throw createError({ statusCode: 400, statusMessage: 'Пустой текст' });
  if (!options.length) throw createError({ statusCode: 400, statusMessage: 'Не передан список вариантов' });

  const list = options.map((o, i) => `${i + 1}. ${o}`).join('\n');
  // Просим отвечать НОМЕРАМИ — маленькая модель делает это стабильнее, а разбор
  // номеров надёжнее, чем сопоставление названий по подстроке.
  const system = multiple
    ? 'Ты классификатор. Из списка пронумерованных вариантов выбери те, что действительно подходят тексту по смыслу (обычно 1–3, можно ни одного). ' +
      'Ответь ТОЛЬКО номерами через запятую, например: 2, 5. Если ничего не подходит — ответь 0. Больше ничего не пиши.'
    : 'Ты классификатор. Из списка пронумерованных вариантов выбери ОДИН, который лучше всего подходит тексту. ' +
      'Ответь ТОЛЬКО его номером, например: 3. Больше ничего не пиши.';

  const user = `Варианты:\n${list}\n\nТекст:\n${text}`;

  const upstream = await fetch(`${ai.baseUrl.replace(/\/$/, '')}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${ai.token}` },
    body: JSON.stringify({
      model: ai.model,
      stream: false,
      think: false,
      options: { temperature: 0 },
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
    }),
  });

  if (!upstream.ok) {
    const detail = await upstream.text().catch(() => '');
    throw createError({ statusCode: 502, statusMessage: `AI недоступен (${upstream.status})`, data: detail.slice(0, 500) });
  }

  const data = await upstream.json().catch(() => null);
  const raw: string = data?.message?.content ?? '';

  // Достаём номера вариантов из ответа и маппим в options (1-based, в границах).
  const picked = new Set<number>();
  for (const m of raw.matchAll(/\d+/g)) {
    const n = Number(m[0]);
    if (n >= 1 && n <= options.length) picked.add(n);
  }

  // Подстраховка: если номеров нет, пробуем точное совпадение названий по строкам/запятым.
  if (!picked.size) {
    const norm = (s: string) => s.toLowerCase().replace(/[«»"'.]/g, '').trim();
    const pieces = raw.split(/[,;\n]/).map(norm);
    options.forEach((opt, i) => {
      if (pieces.includes(norm(opt))) picked.add(i + 1);
    });
  }

  // Сохраняем порядок как в options; для single берём первый.
  const selected = options.filter((_, i) => picked.has(i + 1));
  return { selected: multiple ? selected : selected.slice(0, 1) };
});
