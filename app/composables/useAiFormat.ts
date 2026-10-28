import { ref } from 'vue';
import type { AiModeId } from '~~/services/ai/prompts';

/**
 * Обращение к ИИ-прокси админки (/api/ai/format) со стримингом ответа.
 *
 * Роут на том же origin, что и админка (Nitro), поэтому идём обычным fetch,
 * а не через useApi (тот смотрит на отдельный бэкенд). Ответ читаем по кускам —
 * текст появляется в интерфейсе по мере генерации модели.
 */
export function useAiFormat() {
  const result = ref('');
  const loading = ref(false);
  const error = ref<string | null>(null);

  let controller: AbortController | null = null;

  const abort = () => {
    controller?.abort();
    controller = null;
    loading.value = false;
  };

  const run = async (mode: AiModeId, text: string, options: { maxLength?: number } = {}) => {
    abort();
    result.value = '';
    error.value = null;
    loading.value = true;
    controller = new AbortController();

    try {
      const res = await fetch('/api/ai/format', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode, text, maxLength: options.maxLength }),
        signal: controller.signal,
      });

      if (!res.ok || !res.body) {
        const msg = await res.text().catch(() => '');
        throw new Error(msg || `Ошибка ${res.status}`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        result.value += decoder.decode(value, { stream: true });
      }
    } catch (e) {
      if ((e as Error)?.name !== 'AbortError') {
        error.value = (e as Error)?.message || 'Не удалось обратиться к модели';
      }
    } finally {
      loading.value = false;
      controller = null;
    }
  };

  return { result, loading, error, run, abort };
}
