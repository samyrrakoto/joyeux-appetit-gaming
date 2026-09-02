import { z } from 'zod'
import type { RawgSuggestion } from '#shared/types'

const querySchema = z.object({ q: z.string().trim().default('') })

export default defineEventHandler(
  async (event): Promise<{ configured: boolean; results: RawgSuggestion[] }> => {
    const { q } = await getValidatedQuery(event, querySchema.parse)
    const configured = isRawgConfigured()
    if (!configured) return { configured, results: [] }

    try {
      return { configured, results: await searchRawg(q) }
    } catch (err) {
      console.error('[rawg] recherche en échec', err)
      return { configured, results: [] }
    }
  },
)
