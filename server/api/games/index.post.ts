import { z } from 'zod'
import { eq, sql } from 'drizzle-orm'
import type { CatalogueGameDto } from '#shared/types'

const bodySchema = z.object({
  title: z.string().trim().min(1, 'Entre un titre').max(120),
  rawgId: z.number().int().positive().nullable().optional(),
  coverUrl: coverUrlSchema.nullable().optional(),
})

export default defineEventHandler(async (event): Promise<CatalogueGameDto> => {
  const body = await readValidatedBody(event, bodySchema.parse)
  const db = await useDb()

  const duplicate = body.rawgId
    ? await db.query.games.findFirst({ where: eq(schema.games.rawgId, body.rawgId) })
    : await db.query.games.findFirst({ where: sql`lower(${schema.games.title}) = lower(${body.title})` })
  if (duplicate) {
    throw createError({ statusCode: 409, statusMessage: `« ${duplicate.title} » est déjà dans le catalogue.` })
  }

  const [created] = await db
    .insert(schema.games)
    .values({ title: body.title, rawgId: body.rawgId ?? null, coverUrl: body.coverUrl ?? null })
    .returning()

  return toCatalogueGameDto({ ...created!, playedGames: [], matches: [] })
})
