import type { RawgSuggestion } from '#shared/types'

interface RawgGame {
  id: number
  name: string
  released: string | null
  background_image: string | null
  platforms: { platform: { name: string } }[] | null
}

interface RawgSearchResponse {
  results: RawgGame[]
}

export function isRawgConfigured() {
  return Boolean(useRuntimeConfig().rawgApiKey)
}

export async function searchRawg(query: string): Promise<RawgSuggestion[]> {
  const key = useRuntimeConfig().rawgApiKey
  if (!key || query.trim().length < 2) return []

  const data = await $fetch<RawgSearchResponse>('https://api.rawg.io/api/games', {
    query: { key, search: query.trim(), page_size: 6, search_precise: true },
  })

  return data.results.map(g => ({
    rawgId: g.id,
    title: g.name,
    released: g.released,
    platforms: (g.platforms ?? []).map(p => p.platform.name).slice(0, 3),
    coverUrl: g.background_image,
  }))
}
