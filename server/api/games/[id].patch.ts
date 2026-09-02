import { z } from 'zod'
import { and, eq, ne, sql } from 'drizzle-orm'
import type { CatalogueGameDto } from '#shared/types'

const bodySchema = z.object({
  title: z.string().trim().min(1, 'Entre un titre').max(120).optional(),
  coverUrl: coverUrlSchema.nullable().optional(),
})

export default defineEventHandler(async (event): Promise<CatalogueGameDto> => {
  const id = getRouterParam(event, 'id')!
  const body = await readValidatedBody(event, bodySchema.parse)
  const db = await useDb()

  if (body.title) {
    const duplicate = await db.query.games.findFirst({
      where: and(ne(schema.games.id, id), sql`lower(${schema.games.title}) = lower(${body.title})`),
    })
    if (duplicate) throw createError({ statusCode: 409, statusMessage: 'Un autre jeu porte déjà ce titre.' })
  }

  const [updated] = await db.update(schema.games).set(body).where(eq(schema.games.id, id)).returning()
  if (!updated) throw createError({ statusCode: 404, statusMessage: 'Jeu introuvable' })

  const full = await db.query.games.findFirst({ where: eq(schema.games.id, id), with: gameUsageWith })
  return toCatalogueGameDto(full!)
})
