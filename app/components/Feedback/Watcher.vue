<script setup lang="ts">
/*
 * Невидимый компонент в layout: после входа показывает знакомство с
 * «Ошибками и пожеланиями» (один раз), раз в пару минут обновляет счётчик
 * открытых обращений и показывает уведомления:
 *   — разработчику: появились новые обращения;
 *   — автору: его обращение выполнено.
 */
import FeedbackIntroModal from '~/components/Feedback/IntroModal.vue';

const POLL_MS = 2 * 60 * 1000;

const { isAuthenticated } = useAuth();
const { loadSummary, openReport, storage, userKey } = useFeedback();
const overlay = useOverlay();
const toast = useToast();
const visibility = useDocumentVisibility();

const showIntro = async () => {
  if (storage.get(userKey('intro'))) return;
  const intro = overlay.create(FeedbackIntroModal, { destroyOnClose: true });
  const choice = await intro.open().result;
  storage.set(userKey('intro'), '1');
  if (choice === 'report') await openReport();
};

const check = async () => {
  const key = userKey('checked');
  const since = storage.get(key);
  const startedAt = new Date().toISOString();
  const summary = await loadSummary(since);
  if (!summary) return false;
  storage.set(key, startedAt);
  // Первая проверка — только запоминаем момент, старое не вываливаем
  if (!since) return true;

  if (summary.canManage && summary.newSince > 0) {
    toast.add({
      title: `Новые обращения: ${summary.newSince}`,
      description: `Всего не выполнено: ${summary.open}`,
      icon: 'i-lucide-message-square-warning',
      color: 'warning',
      duration: 10000,
      actions: [{ label: 'Открыть список', to: '/feedback', color: 'warning', variant: 'outline' }],
    });
  }
  for (const done of summary.doneForMe) {
    toast.add({
      title: `Выполнено: ${done.title}`,
      description: done.response ?? 'Ваше обращение отмечено как выполненное',
      icon: 'i-lucide-circle-check-big',
      color: 'success',
      duration: 10000,
    });
  }
  return true;
};

const { pause, resume } = useIntervalFn(
  () => {
    if (visibility.value === 'visible') check();
  },
  POLL_MS,
  { immediate: false }
);

watch(
  isAuthenticated,
  async (authed) => {
    if (!authed) {
      pause();
      return;
    }
    const available = await check();
    resume();
    // Пока бэкенд без /api/feedback — не рекламируем то, что не сработает
    if (available) await showIntro();
  },
  { immediate: true }
);

// Вернулись на вкладку — сразу освежаем счётчик
watch(visibility, (value) => {
  if (value === 'visible' && isAuthenticated.value) check();
});
</script>

<template>
  <span class="hidden" />
</template>
