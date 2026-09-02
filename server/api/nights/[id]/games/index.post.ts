import { z } from 'zod'
import { and, eq, sql } from 'drizzle-orm'
import type { NightDto } from '#shared/types'

const bodySchema = z.object({
  playerId: z.string().uuid(),
  gameId: z.string().uuid().nullable().optional(),
  title: z.string().trim().min(1, 'Entre un titre').max(120),
  rawgId: z.number().int().positive().nullable().optional(),
  coverUrl: z.string().url().nullable().optional(),
  voteNow: z.boolean().default(true),
})

export default defineEventHandler(async (event): Promise<NightDto> => {
  const nightId = getRouterParam(event, 'id')!
  const body = await readValidatedBody(event, bodySchema.parse)
  const db = await useDb()

  const night = await db.query.gameNights.findFirst({ where: eq(schema.gameNights.id, nightId) })
  if (!night) throw createError({ statusCode: 404, statusMessage: 'Soirée introuvable' })

  let game = body.gameId
    ? await db.query.games.findFirst({ where: eq(schema.games.id, body.gameId) })
    : body.rawgId
      ? await db.query.games.findFirst({ where: eq(schema.games.rawgId, body.rawgId) })
      : await db.query.games.findFirst({ where: sql`lower(${schema.games.title}) = lower(${body.title})` })
  if (body.gameId && !game) throw createError({ statusCode: 404, statusMessage: 'Jeu introuvable dans le catalogue' })

  if (!game) {
    ;[game] = await db
      .insert(schema.games)
      .values({ title: body.title, rawgId: body.rawgId ?? null, coverUrl: body.coverUrl ?? null })
      .returning()
  } else if (!game.coverUrl && body.coverUrl) {
    await db.update(schema.games).set({ coverUrl: body.coverUrl }).where(eq(schema.games.id, game.id))
  }

  let nightGame = await db.query.nightGames.findFirst({
    where: and(eq(schema.nightGames.nightId, nightId), eq(schema.nightGames.gameId, game!.id)),
  })
  if (!nightGame) {
    ;[nightGame] = await db
      .insert(schema.nightGames)
      .values({ nightId, gameId: game!.id, proposedBy: body.playerId })
      .returning()
  }

  if (body.voteNow) {
    await db
      .insert(schema.votes)
      .values({ nightGameId: nightGame!.id, playerId: body.playerId })
      .onConflictDoNothing()
  }

  return (await loadNight(db, nightId))!
})
