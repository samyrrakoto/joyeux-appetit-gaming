import type { PlayerDto } from '#shared/types'

export const PLAYER_STORAGE_KEY = 'joyeux-appetit-gaming:player'

export function readStoredPlayer(): PlayerDto | null {
  if (typeof localStorage === 'undefined') return null
  try {
    const raw = localStorage.getItem(PLAYER_STORAGE_KEY)
    return raw ? (JSON.parse(raw) as PlayerDto) : null
  } catch {
    return null
  }
}

export function usePlayer() {
  const player = useState<PlayerDto | null>('player', () => readStoredPlayer())

  function setPlayer(p: PlayerDto | null) {
    player.value = p
    if (typeof localStorage === 'undefined') return
    if (p) localStorage.setItem(PLAYER_STORAGE_KEY, JSON.stringify(p))
    else localStorage.removeItem(PLAYER_STORAGE_KEY)
  }

  return { player, setPlayer }
}
