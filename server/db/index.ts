import { mkdirSync } from 'node:fs'
import { resolve } from 'node:path'
import type { PgDatabase, PgQueryResultHKT } from 'drizzle-orm/pg-core'
import * as schema from './schema'

export type Db = PgDatabase<PgQueryResultHKT, typeof schema>

let dbPromise: Promise<Db> | null = null

async function createDb(): Promise<Db> {
  const url = process.env.DATABASE_URL

  if (url) {
    const { neon } = await import('@neondatabase/serverless')
    const { drizzle } = await import('drizzle-orm/neon-http')
    return drizzle(neon(url), { schema }) as unknown as Db
  }

  const { PGlite } = await import('@electric-sql/pglite')
  const { drizzle } = await import('drizzle-orm/pglite')
  const { migrate } = await import('drizzle-orm/pglite/migrator')
  const dataDir = resolve(process.cwd(), process.env.PGLITE_DIR ?? '.data/pglite')
  mkdirSync(dataDir, { recursive: true })
  const client = new PGlite(dataDir)
  const db = drizzle(client, { schema })
  await migrate(db, { migrationsFolder: resolve(process.cwd(), 'server/db/migrations') })
  console.info(`[db] PGlite local (${dataDir}), migrations appliquées`)
  return db as unknown as Db
}

export function getDb(): Promise<Db> {
  dbPromise ??= createDb()
  return dbPromise
}

export { schema }
