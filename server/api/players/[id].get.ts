import { eq } from 'drizzle-orm'
import type { PlayerDto } from '#shared/types'

export default defineEventHandler(async (event): Promise<PlayerDto> => {
  const id = getRouterParam(event, 'id')!
  const db = await useDb()
  const player = await db.query.players.findFirst({ where: eq(schema.players.id, id) })
  if (!player) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Ce profil n’existe plus. Choisis à nouveau ton profil.',
      data: { code: 'PLAYER_NOT_FOUND' },
    })
  }
  return toPlayerDto(player)
})
