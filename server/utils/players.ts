import { eq } from 'drizzle-orm'

/** Vérifie qu'un profil existe encore, sinon renvoie un 404 explicite (profil mémorisé obsolète). */
export async function assertPlayerExists(db: Db, playerId: string) {
  const player = await db.query.players.findFirst({ where: eq(schema.players.id, playerId), columns: { id: true } })
  if (!player) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Ce profil n’existe plus. Choisis à nouveau ton profil.',
      data: { code: 'PLAYER_NOT_FOUND' },
    })
  }
}
