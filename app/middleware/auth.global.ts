export default defineNuxtRouteMiddleware((to) => {
  const auth = useAuth();
  if (to.path !== '/login' && !auth.isAuthenticated.value) {
    return navigateTo('/login');
  }
});
