import { z } from 'zod'
import { and, eq } from 'drizzle-orm'
import type { NightDto } from '#shared/types'

const bodySchema = z.object({ playerId: z.string().uuid() })

export default defineEventHandler(async (event): Promise<NightDto> => {
  const nightId = getRouterParam(event, 'id')!
  const nightGameId = getRouterParam(event, 'nightGameId')!
  const { playerId } = await readValidatedBody(event, bodySchema.parse)
  const db = await useDb()

  const nightGame = await db.query.nightGames.findFirst({
    where: and(eq(schema.nightGames.id, nightGameId), eq(schema.nightGames.nightId, nightId)),
    with: { night: { columns: { status: true } } },
  })
  if (!nightGame) throw createError({ statusCode: 404, statusMessage: 'Jeu introuvable pour cette soirée' })
  if (nightGame.night.status === 'closed') {
    throw createError({ statusCode: 409, statusMessage: 'Cette soirée est terminée, les votes sont fermés.' })
  }

  const existing = await db.query.votes.findFirst({
    where: and(eq(schema.votes.nightGameId, nightGameId), eq(schema.votes.playerId, playerId)),
  })

  if (existing) {
    await db.delete(schema.votes).where(eq(schema.votes.id, existing.id))
  } else {
    await db.insert(schema.votes).values({ nightGameId, playerId }).onConflictDoNothing()
  }

  return (await loadNight(db, nightId))!
})
