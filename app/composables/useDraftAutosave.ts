/*
 * Автосохранение черновика формы в localStorage: если вкладка закрылась,
 * упал браузер или истекла сессия — при следующем открытии редактора
 * предлагаем восстановить несохранённые изменения.
 *
 * Черновик пишется с задержкой, пока в форме есть несохранённые изменения,
 * и удаляется, когда изменений нет (сохранили или вернули как было).
 */

const STORAGE_PREFIX = 'admin-draft:';
const SAVE_DELAY_MS = 800;
const MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;

interface StoredDraft<T> {
  savedAt: number;
  data: T;
}

export interface DraftAutosave {
  /** Найденный при открытии черновик, который ещё не восстановили и не отбросили. */
  pending: Readonly<Ref<{ savedAt: number } | null>>;
  restore: () => void;
  discard: () => void;
  /** Вызывать после успешного сохранения формы (дальнейшие правки снова пишутся в черновик). */
  clear: () => void;
}

interface UseDraftAutosaveOptions<T> {
  /** Уникальный ключ формы, например `post:<id>` или `post:new`. */
  key: string;
  /** Текущее состояние формы (должно сериализоваться в JSON). */
  data: () => T;
  /** Подставить черновик в форму. */
  apply: (data: T) => void;
  isDirty: Ref<boolean>;
}

const read = <T>(storageKey: string): StoredDraft<T> | null => {
  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredDraft<T>;
    if (!parsed?.savedAt || Date.now() - parsed.savedAt > MAX_AGE_MS) {
      localStorage.removeItem(storageKey);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
};

const remove = (storageKey: string) => {
  try {
    localStorage.removeItem(storageKey);
  } catch {
    // хранилище недоступно (приватный режим) — черновики просто не работают
  }
};

export function useDraftAutosave<T>(options: UseDraftAutosaveOptions<T>): DraftAutosave {
  const { key, data, apply, isDirty } = options;
  const storageKey = STORAGE_PREFIX + key;

  // Черновик из прошлого сеанса держим в памяти: новые правки перезапишут
  // хранилище, но восстановить старый вариант всё ещё можно, пока висит плашка
  let found = read<T>(storageKey);
  if (found && JSON.stringify(found.data) === JSON.stringify(data())) {
    remove(storageKey);
    found = null;
  }
  const pending = ref(found ? { savedAt: found.savedAt } : null);

  const save = useDebounceFn(() => {
    if (!isDirty.value) {
      remove(storageKey);
      return;
    }
    try {
      localStorage.setItem(storageKey, JSON.stringify({ savedAt: Date.now(), data: data() }));
    } catch {
      // переполнение или недоступность хранилища — без черновика
    }
  }, SAVE_DELAY_MS);

  watch(() => JSON.stringify(data()), save);

  const restore = () => {
    if (!found) return;
    apply(found.data);
    found = null;
    pending.value = null;
  };

  const discard = () => {
    found = null;
    pending.value = null;
    if (!isDirty.value) remove(storageKey);
  };

  const clear = () => {
    found = null;
    pending.value = null;
    remove(storageKey);
  };

  return { pending: readonly(pending), restore, discard, clear };
}
