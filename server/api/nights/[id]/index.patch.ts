import { z } from 'zod'
import { eq } from 'drizzle-orm'
import type { NightDto } from '#shared/types'

const bodySchema = z.object({
  status: z.enum(['voting', 'playing', 'closed']).optional(),
  title: z.string().trim().max(60).nullable().optional(),
  nightDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date attendue au format AAAA-MM-JJ').optional(),
})

export default defineEventHandler(async (event): Promise<NightDto> => {
  const id = getRouterParam(event, 'id')!
  const body = await readValidatedBody(event, bodySchema.parse)
  const db = await useDb()

  const [updated] = await db.update(schema.gameNights).set(body).where(eq(schema.gameNights.id, id)).returning()
  if (!updated) throw createError({ statusCode: 404, statusMessage: 'Soirée introuvable' })
  return (await loadNight(db, id))!
})
