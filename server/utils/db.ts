import { getDb } from '../db'

export { schema } from '../db'
export type { Db } from '../db'

export const useDb = getDb
