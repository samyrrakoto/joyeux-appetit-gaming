export default defineNuxtRouteMiddleware(to => {
  if (import.meta.server) return
  const { player } = usePlayer()
  if (to.path !== '/' && !player.value) {
    return navigateTo('/')
  }
})
