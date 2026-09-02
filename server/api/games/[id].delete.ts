import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event): Promise<{ deleted: true }> => {
  const id = getRouterParam(event, 'id')!
  const db = await useDb()

  const game = await db.query.games.findFirst({ where: eq(schema.games.id, id), with: gameUsageWith })
  if (!game) throw createError({ statusCode: 404, statusMessage: 'Jeu introuvable' })
  if (game.nightGames.length || game.matches.length) {
    throw createError({
      statusCode: 409,
      statusMessage: 'Ce jeu a déjà été proposé ou joué, il fait partie de l’historique et ne peut pas être supprimé.',
    })
  }

  await db.delete(schema.games).where(eq(schema.games.id, id))
  return { deleted: true }
})
