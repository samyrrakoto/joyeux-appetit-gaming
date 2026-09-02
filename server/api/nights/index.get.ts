import { desc } from 'drizzle-orm'
import type { NightSummaryDto } from '#shared/types'

export default defineEventHandler(async (): Promise<NightSummaryDto[]> => {
  const db = await useDb()
  const rows = await db.query.gameNights.findMany({
    columns: { id: true },
    orderBy: [desc(schema.gameNights.nightDate), desc(schema.gameNights.createdAt)],
  })

  const summaries: NightSummaryDto[] = []
  for (const row of rows) {
    const night = await loadNight(db, row.id)
    if (night) summaries.push(summarizeNight(night))
  }
  return summaries
})
