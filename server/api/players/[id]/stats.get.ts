import { eq } from 'drizzle-orm'
import type { GameDto, PlayerStatsDto } from '#shared/types'

export default defineEventHandler(async (event): Promise<PlayerStatsDto> => {
  const id = getRouterParam(event, 'id')!
  const db = await useDb()

  const player = await db.query.players.findFirst({ where: eq(schema.players.id, id) })
  if (!player) throw createError({ statusCode: 404, statusMessage: 'Joueur introuvable' })

  const allMatches = await db.query.matches.findMany({
    with: {
      game: true,
      night: { columns: { id: true, nightDate: true } },
      results: { with: { team: { with: { members: { with: { player: true } } } } } },
    },
  })

  const nights = new Set<string>()
  let firstNight: string | null = null

  const myVotes = await db.query.votes.findMany({
    where: eq(schema.votes.playerId, id),
    with: { nightGame: { with: { night: { columns: { id: true, nightDate: true } } } } },
  })
  for (const v of myVotes) {
    nights.add(v.nightGame.night.id)
    if (!firstNight || v.nightGame.night.nightDate < firstNight) firstNight = v.nightGame.night.nightDate
  }
  let matchesCount = 0
  let winsCount = 0
  const perGame = new Map<string, { game: GameDto; played: number; wins: number }>()
  const partners = new Map<string, { player: typeof player; together: number; wins: number }>()

  for (const m of allMatches) {
    const mine = m.results.find(
      r => r.playerId === id || r.team?.members.some(mb => mb.playerId === id),
    )
    if (!mine) continue

    matchesCount++
    nights.add(m.night.id)
    if (!firstNight || m.night.nightDate < firstNight) firstNight = m.night.nightDate
    const won = mine.rank === 1
    if (won) winsCount++

    const g = perGame.get(m.game.id) ?? {
      game: { id: m.game.id, title: m.game.title, rawgId: m.game.rawgId, coverUrl: m.game.coverUrl },
      played: 0,
      wins: 0,
    }
    g.played++
    if (won) g.wins++
    perGame.set(m.game.id, g)

    for (const mb of mine.team?.members ?? []) {
      if (mb.playerId === id) continue
      const p = partners.get(mb.playerId) ?? { player: mb.player, together: 0, wins: 0 }
      p.together++
      if (won) p.wins++
      partners.set(mb.playerId, p)
    }
  }

  const bestPartner = [...partners.values()]
    .filter(p => p.together >= 2)
    .sort((a, b) => b.wins / b.together - a.wins / a.together || b.together - a.together)[0]

  return {
    player: toPlayerDto(player),
    nightsCount: nights.size,
    matchesCount,
    winsCount,
    winRate: matchesCount ? Math.round((winsCount / matchesCount) * 100) : 0,
    firstNight,
    topGames: [...perGame.values()].sort((a, b) => b.wins - a.wins || b.played - a.played).slice(0, 3),
    bestPartner: bestPartner
      ? { player: toPlayerDto(bestPartner.player), together: bestPartner.together, wins: bestPartner.wins }
      : null,
  }
})
