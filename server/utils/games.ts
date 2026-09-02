import { z } from 'zod'
import type { CatalogueGameDto, GameDto } from '#shared/types'

type GameRow = typeof schema.games.$inferSelect
type GameWithUsage = GameRow & {
  playedGames: { nightId: string }[]
  matches: { id: string }[]
}

export function toGameDto(g: GameRow, playedCount: number): GameDto {
  return { id: g.id, title: g.title, rawgId: g.rawgId, coverUrl: g.coverUrl, playedCount }
}

export function toCatalogueGameDto(g: GameWithUsage): CatalogueGameDto {
  return { ...toGameDto(g, g.playedGames.length), createdAt: g.createdAt.toISOString() }
}

export const gameUsageWith = {
  playedGames: { columns: { nightId: true } },
  matches: { columns: { id: true } },
} as const

export const coverUrlSchema = z
  .string()
  .trim()
  .url('Le lien de la jaquette doit être une URL http(s)')
  .regex(/^https?:\/\//, 'Le lien de la jaquette doit commencer par http:// ou https://')
  .max(2000)
