/**
 * Нестриминговый запрос к модели (нативный Ollama API, /api/chat).
 * Nitro автоимпортирует функции из server/utils.
 */
export async function ollamaChat(system: string, user: string, temperature = 0): Promise<string> {
  const { ai } = useRuntimeConfig();

  if (!ai?.token) {
    throw createError({ statusCode: 500, statusMessage: 'AI: токен не настроен (NUXT_AI_TOKEN)' });
  }

  const res = await fetch(`${ai.baseUrl.replace(/\/$/, '')}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${ai.token}` },
    body: JSON.stringify({
      model: ai.model,
      stream: false,
      think: false,
      options: { temperature },
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
    }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw createError({ statusCode: 502, statusMessage: `AI недоступен (${res.status})`, data: detail.slice(0, 500) });
  }

  const data = await res.json().catch(() => null);
  return data?.message?.content ?? '';
}

/**
 * Эмбеддинги текстов одним запросом (модель NUXT_AI_EMBED_MODEL, по умолчанию bge-m3).
 * nginx перед Ollama отвечает 503 на частые запросы — пробуем ещё пару раз.
 */
export async function ollamaEmbed(inputs: string[]): Promise<number[][]> {
  const { ai } = useRuntimeConfig();

  if (!ai?.token) {
    throw createError({ statusCode: 500, statusMessage: 'AI: токен не настроен (NUXT_AI_TOKEN)' });
  }
  if (!inputs.length) return [];

  for (let attempt = 0; ; attempt++) {
    const res = await fetch(`${ai.baseUrl.replace(/\/$/, '')}/api/embed`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${ai.token}` },
      body: JSON.stringify({ model: ai.embedModel, input: inputs }),
    });

    if (res.status === 503 && attempt < 2) {
      await new Promise((r) => setTimeout(r, 1500 * (attempt + 1)));
      continue;
    }
    if (!res.ok) {
      const detail = await res.text().catch(() => '');
      throw createError({ statusCode: 502, statusMessage: `AI-эмбеддинги недоступны (${res.status})`, data: detail.slice(0, 500) });
    }

    const data = await res.json().catch(() => null);
    const embeddings: number[][] | undefined = data?.embeddings;
    if (!Array.isArray(embeddings) || embeddings.length !== inputs.length) {
      throw createError({ statusCode: 502, statusMessage: 'AI: некорректный ответ эмбеддера' });
    }
    return embeddings;
  }
}

export function cosine(a: number[], b: number[]): number {
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i]! * b[i]!;
    na += a[i]! * a[i]!;
    nb += b[i]! * b[i]!;
  }
  return na && nb ? dot / Math.sqrt(na * nb) : 0;
}

/**
 * Номера вариантов из ответа модели — в том порядке, в каком она их назвала,
 * без повторов и только в пределах 1..max. «0» (ничего не подошло) отбрасывается.
 */
export function pickNumbers(raw: string, max: number): number[] {
  const result: number[] = [];
  for (const m of raw.matchAll(/\d+/g)) {
    const n = Number(m[0]);
    if (n >= 1 && n <= max && !result.includes(n)) result.push(n);
  }
  return result;
}
