import { z } from 'zod'
import { sql } from 'drizzle-orm'
import type { PlayerDto } from '#shared/types'

const bodySchema = z.object({
  name: z.string().trim().min(1, 'Entre un pseudo').max(24, '24 caractères max'),
  avatar: z.string().regex(/^[a-z-]+:[a-z]+$/).default('ghost:purple'),
})

export default defineEventHandler(async (event): Promise<PlayerDto> => {
  const body = await readValidatedBody(event, bodySchema.parse)
  const db = await useDb()

  const existing = await db.query.players.findFirst({
    where: sql`lower(${schema.players.name}) = lower(${body.name})`,
  })
  if (existing) {
    throw createError({ statusCode: 409, statusMessage: 'Ce pseudo est déjà pris. Choisis ton profil dans la liste.' })
  }

  const [created] = await db.insert(schema.players).values(body).returning()
  return { ...toPlayerDto(created!), nightsCount: 0 }
})
