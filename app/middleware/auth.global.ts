export default defineNuxtRouteMiddleware(async (to) => {
  const auth = useAuth();
  await auth.checkAuth();

  if (to.path !== '/login' && !auth.isAuthenticated.value) {
    return navigateTo('/login');
  }

  if (to.path === '/login' && auth.isAuthenticated.value) {
    return navigateTo('/');
  }
});
