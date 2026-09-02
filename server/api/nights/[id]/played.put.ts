import { z } from 'zod'
import { eq, inArray } from 'drizzle-orm'
import type { NightDto } from '#shared/types'

const bodySchema = z.object({ gameIds: z.array(z.string().uuid()).max(500) })

/** Remplace la liste des jeux réellement joués pendant la soirée. */
export default defineEventHandler(async (event): Promise<NightDto> => {
  const nightId = getRouterParam(event, 'id')!
  const { gameIds } = await readValidatedBody(event, bodySchema.parse)
  const db = await useDb()

  const night = await db.query.gameNights.findFirst({ where: eq(schema.gameNights.id, nightId) })
  if (!night) throw createError({ statusCode: 404, statusMessage: 'Soirée introuvable' })

  const unique = [...new Set(gameIds)]
  if (unique.length) {
    const known = await db.query.games.findMany({ where: inArray(schema.games.id, unique), columns: { id: true } })
    if (known.length !== unique.length) throw createError({ statusCode: 400, statusMessage: 'Un des jeux est inconnu.' })
  }

  await db.delete(schema.playedGames).where(eq(schema.playedGames.nightId, nightId))
  if (unique.length) {
    await db.insert(schema.playedGames).values(unique.map(gameId => ({ nightId, gameId })))
  }

  return (await loadNight(db, nightId))!
})
