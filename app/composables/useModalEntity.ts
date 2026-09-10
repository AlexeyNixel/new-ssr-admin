import type { Ref } from 'vue';

interface UseModalEntityOptions<T> {
  /** Сущность, переданная в модалку пропсом (режим «данные уже есть»). */
  prop: T | undefined;
  /** Загрузка одной сущности по id, когда пропс не передан. */
  fetchById: (id: string) => Promise<T | null | undefined>;
  /** Имя query-параметра с id. По умолчанию `editId`. */
  param?: string;
}

interface UseModalEntityReturn<T> {
  /** Итоговая сущность: из пропса либо загруженная по id из роута. */
  entity: Ref<T | undefined>;
  /** Идёт запрос за данными (пропс не передан, тянем по id из роута). */
  pending: Ref<boolean>;
  /** Запрос по id из роута завершился ошибкой / сущность не найдена. */
  notFound: Ref<boolean>;
}

/**
 * Резолвит редактируемую сущность внутри модалки:
 * - если данные пришли пропсом (клик по строке таблицы) — используем их;
 * - если пропса нет, но в URL есть `?editId=<id>` — грузим сущность запросом.
 *
 * Форму в модалке нужно наполнять реактивно (`watch(entity, ..., { immediate: true })`),
 * т.к. при загрузке по id `entity` появится не сразу.
 */
export function useModalEntity<T extends { id: string }>(
  options: UseModalEntityOptions<T>
): UseModalEntityReturn<T> {
  const { prop, fetchById, param = 'editId' } = options;
  const route = useRoute();
  const toast = useToast();

  const entity = ref<T | undefined>(prop) as Ref<T | undefined>;
  const pending = ref(false);
  const notFound = ref(false);

  const id = route.query[param];

  if (!entity.value && typeof id === 'string' && id) {
    pending.value = true;
    fetchById(id)
      .then((result) => {
        if (result) {
          entity.value = result;
        } else {
          notFound.value = true;
        }
      })
      .catch(() => {
        notFound.value = true;
      })
      .finally(() => {
        pending.value = false;
        if (notFound.value) {
          toast.add({ title: 'Запись не найдена', color: 'error' });
        }
      });
  }

  return { entity, pending, notFound };
}
