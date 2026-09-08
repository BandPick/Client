export default defineNuxtRouteMiddleware((to) => {
  if (!to.path.startsWith("/admin")) return;
  if (import.meta.server) return;

  const { isAdminAuthenticated } = useAuthApi();
  if (!isAdminAuthenticated()) {
    return navigateTo("/");
  }
});
