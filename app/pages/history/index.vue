<script setup lang="ts">
import { IconChevronRight } from '@tabler/icons-vue'
import type { NightSummaryDto } from '#shared/types'

const { data: nights } = await useFetch<NightSummaryDto[]>('/api/nights', { default: () => [] })

const totals = computed(() => ({
  nights: nights.value.filter(n => n.status === 'closed' || n.matchesCount > 0).length,
  matches: nights.value.reduce((s, n) => s + n.matchesCount, 0),
}))

const statusLabel: Record<string, string> = { voting: 'votes en cours', playing: 'en cours', closed: '' }
</script>

<template>
  <div>
    <h1 style="margin-bottom: 14px">Soirées passées</h1>

    <div class="tiles" style="grid-template-columns: repeat(2, minmax(0, 1fr)); margin-bottom: 16px">
      <div class="tile"><p class="tile__label">Soirées</p><p class="tile__value">{{ totals.nights }}</p></div>
      <div class="tile"><p class="tile__label">Parties</p><p class="tile__value">{{ totals.matches }}</p></div>
    </div>

    <ul v-if="nights.length" class="list">
      <li v-for="n in nights" :key="n.id">
        <NuxtLink :to="`/history/${n.id}`" class="night">
          <div class="night__covers">
            <GameCover v-for="(c, i) in n.covers.slice(0, 2)" :key="i" :src="c" title="" radius="4px" class="night__cover" />
            <GameCover v-if="!n.covers.length" :src="null" title="" radius="4px" class="night__cover" />
          </div>
          <div style="flex: 1; min-width: 0">
            <p class="small" style="font-weight: 600">
              {{ formatNightDate(n.nightDate) }}
              <span v-if="n.status !== 'closed'" class="badge badge--accent" style="margin-left: 6px">{{ statusLabel[n.status] }}</span>
            </p>
            <p class="hint">
              {{ plural(n.playersCount, 'joueur') }} · {{ plural(n.playedCount, 'jeu joué', 'jeux joués') }}<template v-if="n.winner"> · gagnant : {{ n.winner }}</template>
            </p>
          </div>
          <IconChevronRight :size="18" style="color: var(--text-3)" />
        </NuxtLink>
      </li>
    </ul>
    <div v-else class="empty card">
      <h3>Aucune soirée pour l'instant</h3>
      <p class="small">La première apparaîtra ici dès que vous aurez voté ou joué.</p>
    </div>
  </div>
</template>

<style scoped>
.list {
  list-style: none;
  padding: 0;
  margin: 0;
  border-top: 1px solid var(--border);
}

.list li {
  border-bottom: 1px solid var(--border);
}

.night {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 4px;
}

.night__covers {
  display: flex;
  flex-shrink: 0;
}

.night__cover {
  width: 44px;
  outline: 2px solid var(--bg);
}

.night__cover + .night__cover {
  margin-left: -14px;
}
</style>
