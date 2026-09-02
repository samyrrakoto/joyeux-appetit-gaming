import { desc, eq, ne } from 'drizzle-orm'
import type { MatchDto, NightDto, NightGameDto, NightSummaryDto, PlayerDto, TeamDto } from '#shared/types'

export const DEFAULT_WEEKDAY = 3 // mercredi

export function todayInParis() {
  return new Date().toLocaleDateString('fr-CA', { timeZone: 'Europe/Paris' })
}

export function addDays(isoDate: string, days: number) {
  const [y, m, d] = isoDate.split('-').map(Number)
  const date = new Date(Date.UTC(y!, (m ?? 1) - 1, (d ?? 1) + days))
  return date.toISOString().slice(0, 10)
}

/** Premier mercredi à partir de la date donnée (incluse). */
export function nextDefaultNightDate(fromIsoDate: string) {
  const [y, m, d] = fromIsoDate.split('-').map(Number)
  const date = new Date(Date.UTC(y!, (m ?? 1) - 1, d ?? 1))
  const delta = (DEFAULT_WEEKDAY - date.getUTCDay() + 7) % 7
  return addDays(fromIsoDate, delta)
}

export async function getOrCreateCurrentNight(db: Db) {
  const open = await db.query.gameNights.findFirst({
    where: ne(schema.gameNights.status, 'closed'),
    orderBy: [desc(schema.gameNights.nightDate), desc(schema.gameNights.createdAt)],
  })
  if (open) return open

  const latest = await db.query.gameNights.findFirst({
    orderBy: [desc(schema.gameNights.nightDate)],
    columns: { nightDate: true },
  })
  let nightDate = nextDefaultNightDate(todayInParis())
  if (latest && latest.nightDate >= nightDate) {
    nightDate = nextDefaultNightDate(addDays(latest.nightDate, 1))
  }

  const [created] = await db.insert(schema.gameNights).values({ nightDate }).returning()
  return created!
}

type PlayerRow = typeof schema.players.$inferSelect
type TeamRow = typeof schema.teams.$inferSelect & { members: { player: PlayerRow }[] }

export function toPlayerDto(p: PlayerRow): PlayerDto {
  return { id: p.id, name: p.name, avatar: p.avatar }
}

export function toTeamDto(t: TeamRow): TeamDto {
  return { id: t.id, name: t.name, color: t.color, members: t.members.map(m => toPlayerDto(m.player)) }
}

export async function loadNight(db: Db, nightId: string): Promise<NightDto | null> {
  const night = await db.query.gameNights.findFirst({
    where: eq(schema.gameNights.id, nightId),
    with: {
      nightGames: { with: { game: true, proposer: true, votes: { with: { player: true } } } },
      teams: { with: { members: { with: { player: true } } } },
      matches: {
        with: {
          game: true,
          results: { with: { player: true, team: { with: { members: { with: { player: true } } } } } },
        },
      },
    },
  })
  if (!night) return null

  const playersById = new Map<string, PlayerDto>()
  const remember = (p: PlayerRow | null | undefined) => {
    if (p && !playersById.has(p.id)) playersById.set(p.id, toPlayerDto(p))
  }

  const games: NightGameDto[] = night.nightGames.map(ng => {
    remember(ng.proposer)
    ng.votes.forEach(v => remember(v.player))
    return {
      id: ng.id,
      game: { id: ng.game.id, title: ng.game.title, rawgId: ng.game.rawgId, coverUrl: ng.game.coverUrl },
      proposedBy: ng.proposer ? toPlayerDto(ng.proposer) : null,
      voters: ng.votes
        .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
        .map(v => toPlayerDto(v.player)),
    }
  })
  games.sort((a, b) => b.voters.length - a.voters.length || a.game.title.localeCompare(b.game.title))

  const teams: TeamDto[] = night.teams.map(t => {
    t.members.forEach(m => remember(m.player))
    return toTeamDto(t)
  })

  const matches: MatchDto[] = night.matches
    .sort((a, b) => a.playedAt.getTime() - b.playedAt.getTime())
    .map(m => ({
      id: m.id,
      game: { id: m.game.id, title: m.game.title, rawgId: m.game.rawgId, coverUrl: m.game.coverUrl },
      mode: m.mode,
      playedAt: m.playedAt.toISOString(),
      results: m.results
        .sort((a, b) => a.rank - b.rank)
        .map(r => {
          remember(r.player)
          return {
            id: r.id,
            player: r.player ? toPlayerDto(r.player) : null,
            team: r.team ? toTeamDto(r.team) : null,
            score: r.score,
            rank: r.rank,
          }
        }),
    }))

  return {
    id: night.id,
    nightDate: night.nightDate,
    title: night.title,
    status: night.status,
    games,
    teams,
    matches,
    players: [...playersById.values()].sort((a, b) => a.name.localeCompare(b.name)),
  }
}

export function summarizeNight(night: NightDto): NightSummaryDto {
  const firstPlaces = new Map<string, number>()
  for (const match of night.matches) {
    for (const r of match.results) {
      if (r.rank !== 1) continue
      const label = r.team?.name ?? r.player?.name
      if (label) firstPlaces.set(label, (firstPlaces.get(label) ?? 0) + 1)
    }
  }
  const winner = [...firstPlaces.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null

  const covers = [
    ...night.matches.map(m => m.game.coverUrl),
    ...night.games.map(g => g.game.coverUrl),
  ].filter((c): c is string => Boolean(c))

  return {
    id: night.id,
    nightDate: night.nightDate,
    title: night.title,
    status: night.status,
    playersCount: night.players.length,
    matchesCount: night.matches.length,
    covers: [...new Set(covers)].slice(0, 3),
    winner,
  }
}
