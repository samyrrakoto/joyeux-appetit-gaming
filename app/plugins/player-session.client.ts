import type { PlayerDto } from '#shared/types'

/**
 * Au démarrage, vérifie que le profil mémorisé sur l'appareil existe toujours côté serveur.
 * S'il a été supprimé (ou si la base a changé), on oublie le profil et on renvoie à l'accueil.
 */
export default defineNuxtPlugin(nuxtApp => {
  const { player, setPlayer } = usePlayer()

  async function forget() {
    setPlayer(null)
    await navigateTo('/', { replace: true })
  }

  nuxtApp.hook('app:mounted', async () => {
    const stored = player.value
    if (!stored) return
    try {
      const fresh = await $fetch<PlayerDto>(`/api/players/${stored.id}`)
      if (fresh.name !== stored.name || fresh.avatar !== stored.avatar) setPlayer(fresh)
    } catch (e: unknown) {
      const status = (e as { statusCode?: number; response?: { status?: number } }).statusCode
        ?? (e as { response?: { status?: number } }).response?.status
      if (status === 404) await forget()
    }
  })
})
