import type { NightDto } from '#shared/types'

export default defineEventHandler(async (): Promise<NightDto> => {
  const db = await useDb()
  const night = await getOrCreateCurrentNight(db)
  return (await loadNight(db, night.id))!
})
