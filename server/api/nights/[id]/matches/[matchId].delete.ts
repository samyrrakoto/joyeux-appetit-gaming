import { and, eq } from 'drizzle-orm'
import type { NightDto } from '#shared/types'

export default defineEventHandler(async (event): Promise<NightDto> => {
  const nightId = getRouterParam(event, 'id')!
  const matchId = getRouterParam(event, 'matchId')!
  const db = await useDb()

  const match = await db.query.matches.findFirst({
    where: and(eq(schema.matches.id, matchId), eq(schema.matches.nightId, nightId)),
    columns: { id: true },
  })
  if (!match) throw createError({ statusCode: 404, statusMessage: 'Partie introuvable pour cette soirée' })

  await db.delete(schema.matches).where(eq(schema.matches.id, matchId))
  return (await loadNight(db, nightId))!
})
