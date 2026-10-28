export default defineNuxtRouteMiddleware(async (to) => {
  const auth = useAuth();
  await auth.checkAuth();

  if (to.path !== '/login' && !auth.isAuthenticated.value) {
    return navigateTo('/login');
  }

  if (to.path === '/login' && auth.isAuthenticated.value) {
    return navigateTo('/');
  }

  // Раздел, к которому у сотрудника нет доступа, — на главную (бэкенд всё равно ответит 403)
  if (to.path !== '/login' && !useAccess().canPath(to.path)) {
    if (import.meta.client) {
      useToast().add({ title: 'Нет доступа к этому разделу', description: 'Попросите администратора открыть доступ', color: 'warning' });
    }
    return navigateTo('/');
  }
});
