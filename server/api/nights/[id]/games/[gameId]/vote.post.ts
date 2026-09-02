import { z } from 'zod'
import { and, eq } from 'drizzle-orm'
import type { NightDto } from '#shared/types'

const bodySchema = z.object({ playerId: z.string().uuid() })

export default defineEventHandler(async (event): Promise<NightDto> => {
  const nightId = getRouterParam(event, 'id')!
  const gameId = getRouterParam(event, 'gameId')!
  const { playerId } = await readValidatedBody(event, bodySchema.parse)
  const db = await useDb()

  const night = await db.query.gameNights.findFirst({ where: eq(schema.gameNights.id, nightId) })
  if (!night) throw createError({ statusCode: 404, statusMessage: 'Soirée introuvable' })
  if (night.status === 'closed') {
    throw createError({ statusCode: 409, statusMessage: 'Cette soirée est terminée, les votes sont fermés.' })
  }
  const game = await db.query.games.findFirst({ where: eq(schema.games.id, gameId), columns: { id: true } })
  if (!game) throw createError({ statusCode: 404, statusMessage: 'Jeu introuvable' })

  const existing = await db.query.votes.findFirst({
    where: and(eq(schema.votes.nightId, nightId), eq(schema.votes.gameId, gameId), eq(schema.votes.playerId, playerId)),
  })

  if (existing) {
    await db.delete(schema.votes).where(eq(schema.votes.id, existing.id))
  } else {
    await db.insert(schema.votes).values({ nightId, gameId, playerId }).onConflictDoNothing()
  }

  return (await loadNight(db, nightId))!
})
