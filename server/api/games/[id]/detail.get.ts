import { eq } from 'drizzle-orm'
import type { GameDetailDto, GameMatchDto } from '#shared/types'

export default defineEventHandler(async (event): Promise<GameDetailDto> => {
  const id = getRouterParam(event, 'id')!
  const db = await useDb()

  const game = await db.query.games.findFirst({
    where: eq(schema.games.id, id),
    with: {
      playedGames: { columns: { nightId: true } },
      matches: {
        with: {
          night: { columns: { id: true, nightDate: true } },
          results: { with: { player: true, team: { with: { members: { with: { player: true } } } } } },
        },
      },
    },
  })
  if (!game) throw createError({ statusCode: 404, statusMessage: 'Jeu introuvable' })

  const playedCount = game.playedGames.length
  const wins = new Map<string, GameDetailDto['topWinner']>()

  const matches: GameMatchDto[] = game.matches
    .sort((a, b) => b.playedAt.getTime() - a.playedAt.getTime())
    .map(m => ({
      id: m.id,
      nightId: m.night.id,
      nightDate: m.night.nightDate,
      game: toGameDto(game, playedCount),
      mode: m.mode,
      playedAt: m.playedAt.toISOString(),
      results: m.results
        .sort((a, b) => a.rank - b.rank)
        .map(r => {
          if (r.rank === 1) {
            const key = r.teamId ? `team:${r.team!.name}` : `player:${r.playerId}`
            const prev = wins.get(key)
            wins.set(key, {
              kind: r.teamId ? 'team' : 'player',
              label: r.team?.name ?? r.player?.name ?? '?',
              avatar: r.player?.avatar ?? null,
              color: r.team?.color ?? null,
              wins: (prev?.wins ?? 0) + 1,
            })
          }
          return {
            id: r.id,
            player: r.player ? toPlayerDto(r.player) : null,
            team: r.team ? toTeamDto(r.team) : null,
            score: r.score,
            rank: r.rank,
          }
        }),
    }))

  const nights = new Set([...game.playedGames.map(p => p.nightId), ...matches.map(m => m.nightId)])
  const topWinner = [...wins.values()].sort((a, b) => b!.wins - a!.wins)[0] ?? null

  return {
    game: toCatalogueGameDto({ ...game, matches: game.matches.map(m => ({ id: m.id })) }),
    matches,
    nightsCount: nights.size,
    topWinner,
  }
})
