import { z } from 'zod'
import type { CatalogueGameDto } from '#shared/types'

type GameWithUsage = typeof schema.games.$inferSelect & {
  nightGames: { id: string }[]
  matches: { id: string }[]
}

export function toCatalogueGameDto(g: GameWithUsage): CatalogueGameDto {
  return {
    id: g.id,
    title: g.title,
    rawgId: g.rawgId,
    coverUrl: g.coverUrl,
    proposedCount: g.nightGames.length,
    playedCount: g.matches.length,
    createdAt: g.createdAt.toISOString(),
  }
}

export const gameUsageWith = {
  nightGames: { columns: { id: true } },
  matches: { columns: { id: true } },
} as const

export const coverUrlSchema = z
    .string()
    .trim()
    .url('Le lien de la jaquette doit être une URL http(s)')
    .regex(/^https?:\/\//, 'Le lien de la jaquette doit commencer par http:// ou https://')
    .max(2000)
