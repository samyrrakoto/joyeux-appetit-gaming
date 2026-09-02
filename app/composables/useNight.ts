import type { MatchMode, NightDto, NightStatus } from '#shared/types'

interface TeamPayload {
  id?: string
  name: string
  color: string
  memberIds: string[]
}

interface ResultPayload {
  playerId?: string | null
  teamId?: string | null
  score?: number | null
  rank: number
}

export function useNight(options: { poll?: boolean } = {}) {
  const { player } = usePlayer()
  const night = useState<NightDto | null>('night-current', () => null)
  const pending = ref(false)
  const error = ref<string | null>(null)

  async function refresh() {
    try {
      night.value = await $fetch<NightDto>('/api/nights/current')
      error.value = null
    } catch (e) {
      error.value = (e as Error).message
    }
  }

  async function run(fn: () => Promise<NightDto>) {
    pending.value = true
    try {
      night.value = await fn()
      error.value = null
    } catch (e: unknown) {
      const err = e as { data?: { statusMessage?: string }; message?: string }
      error.value = err.data?.statusMessage ?? err.message ?? 'Une erreur est survenue'
      throw e
    } finally {
      pending.value = false
    }
  }

  const nightId = () => {
    if (!night.value) throw new Error('Soirée non chargée')
    return night.value.id
  }

  const toggleVote = (gameId: string) =>
    run(() =>
      $fetch<NightDto>(`/api/nights/${nightId()}/games/${gameId}/vote`, {
        method: 'POST',
        body: { playerId: player.value!.id },
      }),
    )

  const setPlayed = (gameIds: string[]) =>
    run(() => $fetch<NightDto>(`/api/nights/${nightId()}/played`, { method: 'PUT', body: { gameIds } }))

  const setStatus = (status: NightStatus) =>
    run(() => $fetch<NightDto>(`/api/nights/${nightId()}`, { method: 'PATCH', body: { status } }))

  const setDate = (nightDate: string) =>
    run(() => $fetch<NightDto>(`/api/nights/${nightId()}`, { method: 'PATCH', body: { nightDate } }))

  const saveTeams = (teams: TeamPayload[]) =>
    run(() => $fetch<NightDto>(`/api/nights/${nightId()}/teams`, { method: 'PUT', body: { teams } }))

  const recordMatch = (gameId: string, mode: MatchMode, results: ResultPayload[]) =>
    run(() =>
      $fetch<NightDto>(`/api/nights/${nightId()}/matches`, { method: 'POST', body: { gameId, mode, results } }),
    )

  if (options.poll) {
    let timer: ReturnType<typeof setInterval> | undefined
    onMounted(() => {
      timer = setInterval(() => {
        if (document.visibilityState === 'visible' && !pending.value) refresh()
      }, 4000)
    })
    onUnmounted(() => clearInterval(timer))
  }

  const myVotes = computed(() => {
    const me = player.value?.id
    if (!night.value || !me) return new Set<string>()
    return new Set(night.value.games.filter(g => g.voters.some(v => v.id === me)).map(g => g.game.id))
  })

  return { night, pending, error, refresh, toggleVote, setPlayed, setStatus, setDate, saveTeams, recordMatch, myVotes }
}
