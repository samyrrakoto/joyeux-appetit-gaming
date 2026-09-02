import type { NightDto } from '#shared/types'

export default defineEventHandler(async (event): Promise<NightDto> => {
  const id = getRouterParam(event, 'id')!
  const db = await useDb()
  const night = await loadNight(db, id)
  if (!night) throw createError({ statusCode: 404, statusMessage: 'Soirée introuvable' })
  return night
})
