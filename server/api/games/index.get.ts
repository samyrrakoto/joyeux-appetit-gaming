import { asc } from 'drizzle-orm'
import type { CatalogueGameDto } from '#shared/types'

export default defineEventHandler(async (): Promise<CatalogueGameDto[]> => {
  const db = await useDb()
  const rows = await db.query.games.findMany({
    orderBy: [asc(schema.games.title)],
    with: gameUsageWith,
  })
  return rows.map(toCatalogueGameDto)
})
