export default defineNuxtRouteMiddleware((to, from) => {
  if(!userIsAuthenticated()) {
    abortNavigation()
    return navigateTo('/auth/login')
  }
})