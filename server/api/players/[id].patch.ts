import { z } from 'zod'
import { eq } from 'drizzle-orm'
import type { PlayerDto } from '#shared/types'

const bodySchema = z.object({
  name: z.string().trim().min(1).max(24).optional(),
  avatar: z.string().regex(/^[a-z-]+:[a-z]+$/).optional(),
})

export default defineEventHandler(async (event): Promise<PlayerDto> => {
  const id = getRouterParam(event, 'id')!
  const body = await readValidatedBody(event, bodySchema.parse)
  const db = await useDb()

  const [updated] = await db.update(schema.players).set(body).where(eq(schema.players.id, id)).returning()
  if (!updated) throw createError({ statusCode: 404, statusMessage: 'Joueur introuvable' })
  return toPlayerDto(updated)
})
