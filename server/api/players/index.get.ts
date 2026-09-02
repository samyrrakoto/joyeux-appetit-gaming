import { asc } from 'drizzle-orm'
import type { PlayerDto } from '#shared/types'

export default defineEventHandler(async (): Promise<PlayerDto[]> => {
  const db = await useDb()
  const rows = await db.query.players.findMany({
    orderBy: [asc(schema.players.name)],
    with: {
      votes: { columns: { nightId: true } },
      teamMemberships: { with: { team: { columns: { nightId: true } } } },
    },
  })

  return rows
    .map(p => {
      const nights = new Set<string>()
      p.votes.forEach(v => nights.add(v.nightId))
      p.teamMemberships.forEach(m => nights.add(m.team.nightId))
      return { id: p.id, name: p.name, avatar: p.avatar, nightsCount: nights.size }
    })
    .sort((a, b) => b.nightsCount - a.nightsCount || a.name.localeCompare(b.name))
})
