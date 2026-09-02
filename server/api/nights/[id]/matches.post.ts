import { z } from 'zod'
import { eq } from 'drizzle-orm'
import type { NightDto } from '#shared/types'

const resultSchema = z
  .object({
    playerId: z.string().uuid().nullable().optional(),
    teamId: z.string().uuid().nullable().optional(),
    score: z.number().int().nullable().optional(),
    rank: z.number().int().min(1),
  })
  .refine(r => Boolean(r.playerId) !== Boolean(r.teamId), 'Un résultat vise un joueur ou une équipe, pas les deux')

const bodySchema = z.object({
  gameId: z.string().uuid(),
  mode: z.enum(['solo', 'team']),
  results: z.array(resultSchema).min(1, 'Il faut au moins un participant'),
})

export default defineEventHandler(async (event): Promise<NightDto> => {
  const nightId = getRouterParam(event, 'id')!
  const body = await readValidatedBody(event, bodySchema.parse)
  const db = await useDb()

  const night = await db.query.gameNights.findFirst({ where: eq(schema.gameNights.id, nightId) })
  if (!night) throw createError({ statusCode: 404, statusMessage: 'Soirée introuvable' })

  const [match] = await db
    .insert(schema.matches)
    .values({ nightId, gameId: body.gameId, mode: body.mode })
    .returning()

  await db.insert(schema.results).values(
    body.results.map(r => ({
      matchId: match!.id,
      playerId: r.playerId ?? null,
      teamId: r.teamId ?? null,
      score: r.score ?? null,
      rank: r.rank,
    })),
  )

  if (night.status === 'voting') {
    await db.update(schema.gameNights).set({ status: 'playing' }).where(eq(schema.gameNights.id, nightId))
  }

  return (await loadNight(db, nightId))!
})
