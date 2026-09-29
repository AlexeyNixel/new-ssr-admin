import type { LocationQueryValue } from 'vue-router';

/*
 * Состояние списка (страница, поиск, фильтры) в query-параметрах URL.
 * Благодаря этому после «Сохранить» в редакторе и «Назад» пользователь
 * возвращается на ту же страницу списка с теми же фильтрами, а ссылкой
 * на отфильтрованный список можно поделиться.
 *
 *   const { page, search, filters } = useListQuery({ status: 'all' });
 *
 * Значения по умолчанию в URL не пишутся. При смене поиска/фильтров
 * страница сбрасывается на первую.
 */
export function useListQuery<F extends Record<string, string>>(filterDefaults: F = {} as F) {
  const route = useRoute();
  const router = useRouter();

  const read = (value: LocationQueryValue | LocationQueryValue[] | undefined) =>
    (Array.isArray(value) ? value[0] : value) ?? undefined;

  const page = ref(Math.max(1, Number(read(route.query.page)) || 1));
  const search = ref(read(route.query.q) ?? '');
  const filters = reactive(
    Object.fromEntries(
      Object.entries(filterDefaults).map(([key, fallback]) => [key, read(route.query[key]) ?? fallback])
    )
  ) as F;

  watch([search, () => ({ ...filters })], () => {
    page.value = 1;
  });

  watch(
    [page, search, () => ({ ...filters })],
    () => {
      const query: Record<string, string> = {};
      if (page.value > 1) query.page = String(page.value);
      if (search.value) query.q = search.value;
      for (const [key, value] of Object.entries(filters)) {
        if (value !== filterDefaults[key]) query[key] = value;
      }
      router.replace({ query });
    },
    { flush: 'post' }
  );

  return { page, search, filters };
}
