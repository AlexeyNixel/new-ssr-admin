import { ref } from 'vue';

/**
 * Классификация текста по закрытому списку вариантов через /api/ai/classify.
 * Сервер гарантирует, что вернутся только значения из переданного options.
 */
export function useAiClassify() {
  const loading = ref(false);
  const error = ref<string | null>(null);

  const classify = async (
    text: string,
    options: string[],
    multiple = true
  ): Promise<string[]> => {
    loading.value = true;
    error.value = null;
    try {
      const res = await $fetch<{ selected: string[] }>('/api/ai/classify', {
        method: 'POST',
        body: { text, options, multiple },
      });
      return res.selected ?? [];
    } catch (e) {
      error.value = (e as Error)?.message || 'Не удалось обратиться к модели';
      return [];
    } finally {
      loading.value = false;
    }
  };

  return { classify, loading, error };
}
