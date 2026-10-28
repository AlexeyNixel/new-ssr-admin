<script setup lang="ts">
/*
 * Невидимый компонент в layout: после входа показывает знакомство с
 * «Ошибками и пожеланиями» (один раз), раз в пару минут обновляет счётчик
 * открытых обращений и показывает уведомления:
 *   — разработчику: появились новые обращения;
 *   — автору: его обращение выполнено.
 */
const POLL_MS = 2 * 60 * 1000;
// Сменить версию — объявление покажется всем ещё раз
const INTRO_KEY = 'intro-v2';

const { isAuthenticated } = useAuth();
const { loadSummary, openIntro, storage, userKey } = useFeedback();
const route = useRoute();
const toast = useToast();
const visibility = useDocumentVisibility();

// Объявление — один раз на пользователя, только на рабочих страницах (не на
// /login, откуда сразу уходит редирект). Просмотренным считаем лишь после
// нажатия кнопки в окне: перезагрузили страницу раньше — покажем снова.
let introOpened = false;
const showIntro = async () => {
  if (introOpened || !isAuthenticated.value || route.path === '/login') return;
  if (storage.get(userKey(INTRO_KEY))) return;
  introOpened = true;
  await openIntro();
  storage.set(userKey(INTRO_KEY), '1');
};

watch([isAuthenticated, () => route.path], () => nextTick(showIntro), { immediate: true });

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
    await check();
    resume();
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
