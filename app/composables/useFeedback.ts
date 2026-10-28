import { useFeedbackApi } from '~~/services/api/feedback.api';
import type { Feedback, FeedbackSummary } from '~~/services/types/feedback.type';
import type { User } from '~~/services/types/user.type';
import AdminFeedback from '~/components/Modals/AdminFeedback.vue';

/*
 * «Ошибки и пожелания» — общее состояние для меню (чип с числом открытых),
 * страницы /feedback и наблюдателя уведомлений (FeedbackWatcher).
 */

/** localStorage может быть недоступен (приватный режим) — тогда просто не помним */
const storage = {
  get(key: string) {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  set(key: string, value: string) {
    try {
      localStorage.setItem(key, value);
    } catch {
      // ничего страшного: максимум покажем подсказку ещё раз
    }
  },
};

export const useFeedback = () => {
  const feedbackApi = useFeedbackApi();
  const overlay = useOverlay();
  const route = useRoute();
  const user = useCookie<User | null>('user_data');
  const summary = useState<FeedbackSummary | null>('feedback-summary', () => null);

  /** Ключ localStorage, свой у каждого пользователя */
  const userKey = (name: string) => `feedback-${name}:${user.value?.id ?? 'anon'}`;

  const loadSummary = async (since?: string | null) => {
    try {
      const result = await feedbackApi.getSummary(since);
      summary.value = result;
      return result;
    } catch {
      // эндпоинта может ещё не быть на сервере — чип просто не покажется
      return null;
    }
  };

  /** Открыть форму обращения; страница подставляется текущая */
  const openReport = async (feedback?: Feedback) => {
    const modal = overlay.create(AdminFeedback, { destroyOnClose: true });
    const saved = await modal.open({
      feedback,
      pageUrl: route.path === '/feedback' ? undefined : route.fullPath,
      canManage: summary.value?.canManage ?? false,
    }).result;
    if (saved) await loadSummary();
    return !!saved;
  };

  return {
    summary,
    openCount: computed(() => summary.value?.open ?? 0),
    canManage: computed(() => summary.value?.canManage ?? false),
    currentUserId: computed(() => user.value?.id),
    loadSummary,
    openReport,
    storage,
    userKey,
  };
};
