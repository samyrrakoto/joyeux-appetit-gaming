import { relations, sql } from 'drizzle-orm'
import {
  check,
  date,
  integer,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core'

export const players = pgTable('players', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull().unique(),
  avatar: text('avatar').notNull().default('ghost:purple'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const gameNights = pgTable('game_nights', {
  id: uuid('id').primaryKey().defaultRandom(),
  nightDate: date('night_date').notNull(),
  title: text('title'),
  status: text('status', { enum: ['voting', 'playing', 'closed'] }).notNull().default('voting'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const games = pgTable('games', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: text('title').notNull(),
  rawgId: integer('rawg_id').unique(),
  coverUrl: text('cover_url'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const votes = pgTable(
  'votes',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    nightId: uuid('night_id').notNull().references(() => gameNights.id, { onDelete: 'cascade' }),
    gameId: uuid('game_id').notNull().references(() => games.id, { onDelete: 'cascade' }),
    playerId: uuid('player_id').notNull().references(() => players.id),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  t => [uniqueIndex('votes_night_game_player_idx').on(t.nightId, t.gameId, t.playerId)],
)

/** Jeux réellement joués au cours d'une soirée, cochés en fin de soirée. */
export const playedGames = pgTable(
  'played_games',
  {
    nightId: uuid('night_id').notNull().references(() => gameNights.id, { onDelete: 'cascade' }),
    gameId: uuid('game_id').notNull().references(() => games.id),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  t => [primaryKey({ columns: [t.nightId, t.gameId] })],
)

export const teams = pgTable('teams', {
  id: uuid('id').primaryKey().defaultRandom(),
  nightId: uuid('night_id').notNull().references(() => gameNights.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  color: text('color').notNull().default('coral'),
})

export const teamMembers = pgTable(
  'team_members',
  {
    teamId: uuid('team_id').notNull().references(() => teams.id, { onDelete: 'cascade' }),
    playerId: uuid('player_id').notNull().references(() => players.id),
  },
  t => [primaryKey({ columns: [t.teamId, t.playerId] })],
)

export const matches = pgTable('matches', {
  id: uuid('id').primaryKey().defaultRandom(),
  nightId: uuid('night_id').notNull().references(() => gameNights.id, { onDelete: 'cascade' }),
  gameId: uuid('game_id').notNull().references(() => games.id),
  mode: text('mode', { enum: ['solo', 'team'] }).notNull(),
  playedAt: timestamp('played_at', { withTimezone: true }).notNull().defaultNow(),
})

export const results = pgTable(
  'results',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    matchId: uuid('match_id').notNull().references(() => matches.id, { onDelete: 'cascade' }),
    playerId: uuid('player_id').references(() => players.id),
    teamId: uuid('team_id').references(() => teams.id),
    score: integer('score'),
    rank: integer('rank').notNull(),
  },
  t => [
    check(
      'results_player_xor_team',
      sql`(${t.playerId} IS NOT NULL AND ${t.teamId} IS NULL) OR (${t.playerId} IS NULL AND ${t.teamId} IS NOT NULL)`,
    ),
  ],
)

export const playersRelations = relations(players, ({ many }) => ({
  votes: many(votes),
  teamMemberships: many(teamMembers),
  results: many(results),
}))

export const gameNightsRelations = relations(gameNights, ({ many }) => ({
  votes: many(votes),
  playedGames: many(playedGames),
  teams: many(teams),
  matches: many(matches),
}))

export const gamesRelations = relations(games, ({ many }) => ({
  votes: many(votes),
  playedGames: many(playedGames),
  matches: many(matches),
}))

export const votesRelations = relations(votes, ({ one }) => ({
  night: one(gameNights, { fields: [votes.nightId], references: [gameNights.id] }),
  game: one(games, { fields: [votes.gameId], references: [games.id] }),
  player: one(players, { fields: [votes.playerId], references: [players.id] }),
}))

export const playedGamesRelations = relations(playedGames, ({ one }) => ({
  night: one(gameNights, { fields: [playedGames.nightId], references: [gameNights.id] }),
  game: one(games, { fields: [playedGames.gameId], references: [games.id] }),
}))

export const teamsRelations = relations(teams, ({ one, many }) => ({
  night: one(gameNights, { fields: [teams.nightId], references: [gameNights.id] }),
  members: many(teamMembers),
  results: many(results),
}))

export const teamMembersRelations = relations(teamMembers, ({ one }) => ({
  team: one(teams, { fields: [teamMembers.teamId], references: [teams.id] }),
  player: one(players, { fields: [teamMembers.playerId], references: [players.id] }),
}))

export const matchesRelations = relations(matches, ({ one, many }) => ({
  night: one(gameNights, { fields: [matches.nightId], references: [gameNights.id] }),
  game: one(games, { fields: [matches.gameId], references: [games.id] }),
  results: many(results),
}))

export const resultsRelations = relations(results, ({ one }) => ({
  match: one(matches, { fields: [results.matchId], references: [matches.id] }),
  player: one(players, { fields: [results.playerId], references: [players.id] }),
  team: one(teams, { fields: [results.teamId], references: [teams.id] }),
}))
