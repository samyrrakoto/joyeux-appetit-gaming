export type NightStatus = 'voting' | 'playing' | 'closed'
export type MatchMode = 'solo' | 'team'

export interface PlayerDto {
  id: string
  name: string
  avatar: string
  nightsCount?: number
}

export interface GameDto {
  id: string
  title: string
  rawgId: number | null
  coverUrl: string | null
}

export interface NightGameDto {
  id: string
  game: GameDto
  proposedBy: PlayerDto | null
  voters: PlayerDto[]
}

export interface TeamDto {
  id: string
  name: string
  color: string
  members: PlayerDto[]
}

export interface ResultDto {
  id: string
  player: PlayerDto | null
  team: TeamDto | null
  score: number | null
  rank: number
}

export interface MatchDto {
  id: string
  game: GameDto
  mode: MatchMode
  playedAt: string
  results: ResultDto[]
}

export interface NightDto {
  id: string
  nightDate: string
  title: string | null
  status: NightStatus
  games: NightGameDto[]
  teams: TeamDto[]
  matches: MatchDto[]
  players: PlayerDto[]
}

export interface NightSummaryDto {
  id: string
  nightDate: string
  title: string | null
  status: NightStatus
  playersCount: number
  matchesCount: number
  covers: string[]
  winner: string | null
}

export interface RawgSuggestion {
  rawgId: number
  title: string
  released: string | null
  platforms: string[]
  coverUrl: string | null
}

export interface PlayerStatsDto {
  player: PlayerDto
  nightsCount: number
  matchesCount: number
  winsCount: number
  winRate: number
  firstNight: string | null
  topGames: { game: GameDto; played: number; wins: number }[]
  bestPartner: { player: PlayerDto; together: number; wins: number } | null
}
