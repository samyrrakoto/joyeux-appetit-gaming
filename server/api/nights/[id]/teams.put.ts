import { z } from 'zod'
import { eq, inArray, notInArray } from 'drizzle-orm'
import type { NightDto } from '#shared/types'

const bodySchema = z.object({
  teams: z
    .array(
      z.object({
        id: z.string().uuid().optional(),
        name: z.string().trim().min(1).max(30),
        color: z.string().regex(/^[a-z]+$/),
        memberIds: z.array(z.string().uuid()),
      }),
    )
    .max(8),
})

export default defineEventHandler(async (event): Promise<NightDto> => {
  const nightId = getRouterParam(event, 'id')!
  const { teams } = await readValidatedBody(event, bodySchema.parse)
  const db = await useDb()

  const night = await db.query.gameNights.findFirst({ where: eq(schema.gameNights.id, nightId) })
  if (!night) throw createError({ statusCode: 404, statusMessage: 'Soirée introuvable' })

  const seen = new Set<string>()
  for (const t of teams) {
    for (const id of t.memberIds) {
      if (seen.has(id)) throw createError({ statusCode: 400, statusMessage: 'Un joueur ne peut être que dans une équipe.' })
      seen.add(id)
    }
  }

  const keptIds: string[] = []
  for (const t of teams) {
    let teamId = t.id
    if (teamId) {
      const [updated] = await db
        .update(schema.teams)
        .set({ name: t.name, color: t.color })
        .where(eq(schema.teams.id, teamId))
        .returning()
      if (!updated) teamId = undefined
    }
    if (!teamId) {
      const [created] = await db
        .insert(schema.teams)
        .values({ nightId, name: t.name, color: t.color })
        .returning()
      teamId = created!.id
    }
    keptIds.push(teamId)

    await db.delete(schema.teamMembers).where(eq(schema.teamMembers.teamId, teamId))
    if (t.memberIds.length) {
      await db.insert(schema.teamMembers).values(t.memberIds.map(playerId => ({ teamId: teamId!, playerId })))
    }
  }

  const stale = await db.query.teams.findMany({
    where: keptIds.length
      ? notInArray(schema.teams.id, keptIds)
      : eq(schema.teams.nightId, nightId),
    columns: { id: true, nightId: true },
    with: { results: { columns: { id: true } } },
  })
  const deletable = stale.filter(t => t.nightId === nightId && t.results.length === 0).map(t => t.id)
  if (deletable.length) await db.delete(schema.teams).where(inArray(schema.teams.id, deletable))

  return (await loadNight(db, nightId))!
})
