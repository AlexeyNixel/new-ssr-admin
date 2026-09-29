import type { FormErrorEvent } from '@nuxt/ui';

interface UseEntityFormOptions {
  /** Снимок состояния формы — по нему определяется, есть ли несохранённые изменения. */
  snapshot: () => unknown;
  /** Человекочитаемые названия полей для тоста с ошибками валидации. */
  fieldLabels: Record<string, string>;
  /** Отправка формы по Ctrl/⌘ + S. */
  submit: () => void;
}

/**
 * Общее поведение полноэкранных форм редактирования (новости, страницы,
 * комиксы, игры, события, слайды):
 * - отслеживание несохранённых изменений + предупреждение при уходе;
 * - Ctrl/⌘ + S — сохранить;
 * - при ошибке валидации — тост со списком полей и прокрутка к первому.
 *
 * Вызывать после того, как форма наполнена загруженными данными.
 */
export function useEntityForm(options: UseEntityFormOptions) {
  const { snapshot, fieldLabels, submit } = options;
  const toast = useToast();

  const serialize = () => JSON.stringify(snapshot());
  const savedState = ref(serialize());
  const isDirty = computed(() => savedState.value !== serialize());

  /** Вызывать после успешного сохранения, перед переходом на список. */
  const markSaved = () => {
    savedState.value = serialize();
  };

  onBeforeRouteLeave(() => {
    if (isDirty.value && !window.confirm('Есть несохранённые изменения. Уйти со страницы?')) {
      return false;
    }
  });

  useEventListener(window, 'beforeunload', (event: BeforeUnloadEvent) => {
    if (isDirty.value) event.preventDefault();
  });

  useEventListener(window, 'keydown', (event: KeyboardEvent) => {
    if ((event.ctrlKey || event.metaKey) && event.code === 'KeyS') {
      event.preventDefault();
      submit();
    }
  });

  const onError = (event: FormErrorEvent) => {
    const fields = [
      ...new Set(event.errors.map((error) => fieldLabels[error.name ?? ''] ?? error.name)),
    ];
    toast.add({
      title: 'Проверьте заполнение полей',
      description: fields.filter(Boolean).join(', '),
      color: 'error',
    });
    const name = event.errors[0]?.name;
    const field = name ? document.querySelector(`[data-field="${name}"]`) : null;
    field?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    const input = document.getElementById(event.errors[0]?.id ?? '');
    input?.focus({ preventScroll: true });
  };

  return { isDirty, markSaved, onError };
}

/** Статус публикации для шапки формы (soft-delete через `isDeleted`). */
export const publicationStatus = (
  isUpdate: boolean,
  isDeleted: boolean,
  labels: { shown: string; hidden: string; created?: string } = {
    shown: 'Опубликовано',
    hidden: 'Скрыто',
  }
) => {
  if (!isUpdate) return { label: labels.created ?? 'Новая запись', color: 'neutral' as const };
  return isDeleted
    ? { label: labels.hidden, color: 'warning' as const }
    : { label: labels.shown, color: 'success' as const };
};

/**
 * Старые ссылки `/<entity>?editId=<id>` (модалки) ведут на страницу
 * редактирования `/<entity>/admin/<id>`.
 */
export const redirectEditIdToPage = async (base: string) => {
  const route = useRoute();
  const id = route.query.editId;
  if (typeof id === 'string' && id) {
    await navigateTo(`${base}/admin/${id}`, { replace: true });
  }
};
