<script setup lang="ts">
import { IconArrowLeft, IconTrophy } from '@tabler/icons-vue'
import type { MatchMode } from '#shared/types'

interface Row {
  key: string
  playerId?: string
  teamId?: string
  label: string
  sub?: string
  avatar?: string
  color?: string
  included: boolean
  score: number | null
  manualRank: number | null
}

const { night, pending, error, refresh, recordMatch } = useNight()
await refresh()

const gameOptions = computed(() =>
  [...(night.value?.games ?? [])]
    .sort(
      (a, b) =>
        Number(b.playedTonight) - Number(a.playedTonight) ||
        b.voters.length - a.voters.length ||
        a.game.title.localeCompare(b.game.title, 'fr'),
    )
    .map(g => ({ id: g.game.id, title: g.game.title, hint: g.playedTonight ? 'joué ce soir' : g.voters.length ? plural(g.voters.length, 'vote') : '' })),
)

const route = useRoute()
const requested = typeof route.query.game === 'string' ? route.query.game : null
const gameId = ref(
  (requested && gameOptions.value.some(g => g.id === requested) ? requested : null) ?? gameOptions.value[0]?.id ?? '',
)
const mode = ref<MatchMode>(night.value?.teams.length ? 'team' : 'solo')
const manual = ref(false)
const formError = ref('')

const selectedGame = computed(() => night.value?.games.find(g => g.game.id === gameId.value)?.game ?? null)

const rows = ref<Row[]>([])

function buildRows() {
  if (!night.value) return
  rows.value =
    mode.value === 'team'
      ? night.value.teams.map(t => ({
          key: t.id,
          teamId: t.id,
          label: t.name,
          sub: t.members.map(m => m.name).join(', ') || 'aucun membre',
          color: t.color,
          included: t.members.length > 0,
          score: null,
          manualRank: null,
        }))
      : night.value.players.map(p => ({
          key: p.id,
          playerId: p.id,
          label: p.name,
          avatar: p.avatar,
          included: true,
          score: null,
          manualRank: null,
        }))
}
watch(mode, buildRows, { immediate: true })

const ranked = computed(() => {
  const included = rows.value.filter(r => r.included)
  if (manual.value) {
    return included.map(r => ({ row: r, rank: r.manualRank ?? included.length }))
  }
  const sorted = [...included].sort((a, b) => (b.score ?? -Infinity) - (a.score ?? -Infinity))
  let lastScore: number | null | undefined
  let lastRank = 0
  return sorted.map((row, i) => {
    const rank = row.score === lastScore ? lastRank : i + 1
    lastScore = row.score
    lastRank = rank
    return { row, rank }
  })
})

const rankOf = (key: string) => ranked.value.find(r => r.row.key === key)?.rank ?? null

async function submit() {
  formError.value = ''
  if (!gameId.value) {
    formError.value = 'Choisis le jeu joué'
    return
  }
  const included = rows.value.filter(r => r.included)
  if (!included.length) {
    formError.value = 'Coche au moins un participant'
    return
  }
  if (!manual.value && included.some(r => r.score === null)) {
    formError.value = 'Renseigne un score pour chaque participant, ou passe en classement manuel'
    return
  }
  if (manual.value && included.some(r => !r.manualRank)) {
    formError.value = 'Renseigne un rang pour chaque participant'
    return
  }
  await recordMatch(
    gameId.value,
    mode.value,
    ranked.value.map(({ row, rank }) => ({
      playerId: row.playerId ?? null,
      teamId: row.teamId ?? null,
      score: manual.value ? null : row.score,
      rank,
    })),
  )
  await navigateTo('/tonight')
}
</script>

<template>
  <div>
    <header class="page-header">
      <NuxtLink to="/tonight" class="btn btn--ghost btn--icon" aria-label="Retour"><IconArrowLeft :size="20" /></NuxtLink>
      <h1>Résultat de la partie</h1>
    </header>

    <div v-if="!gameOptions.length" class="empty card">
      <h3>Le catalogue est vide</h3>
      <p class="small">Ajoute d'abord un jeu depuis l'onglet Jeux.</p>
    </div>

    <template v-else>
      <div class="game-pick card">
        <GameCover :src="selectedGame?.coverUrl" :title="selectedGame?.title ?? ''" radius="6px" class="game-pick__cover" />
        <div style="flex: 1; min-width: 0">
          <label class="label" for="game">Jeu joué</label>
          <select id="game" v-model="gameId" class="input" style="height: 40px">
            <option v-for="g in gameOptions" :key="g.id" :value="g.id">{{ g.title }}<template v-if="g.hint"> · {{ g.hint }}</template></option>
          </select>
        </div>
      </div>

      <div class="segmented" style="margin: 14px 0">
        <button type="button" class="segmented__item" :class="{ 'segmented__item--active': mode === 'solo' }" @click="mode = 'solo'">Solo</button>
        <button type="button" class="segmented__item" :class="{ 'segmented__item--active': mode === 'team' }" @click="mode = 'team'">Par équipe</button>
      </div>

      <div v-if="mode === 'team' && !night?.teams.length" class="empty card" style="margin-bottom: 14px">
        <h3>Pas d'équipes</h3>
        <p class="small">Compose-les d'abord, ou passe en mode solo.</p>
        <NuxtLink to="/teams" class="btn btn--sm" style="margin-top: 10px">Composer les équipes</NuxtLink>
      </div>

      <div v-else-if="mode === 'solo' && !rows.length" class="empty card" style="margin-bottom: 14px">
        <h3>Personne n'a encore voté</h3>
        <p class="small">Les joueurs apparaissent ici dès qu'ils ont voté ou rejoint une équipe.</p>
      </div>

      <ul v-else class="rows">
        <li v-for="r in rows" :key="r.key" class="result card" :class="{ 'result--off': !r.included }">
          <input v-model="r.included" type="checkbox" class="result__check" :aria-label="`Inclure ${r.label}`" />
          <span class="rank" :class="{ 'rank--first': rankOf(r.key) === 1 && r.included }">
            {{ r.included ? rankOf(r.key) : '–' }}
          </span>
          <span v-if="r.color" class="dot" :style="{ background: teamColor(r.color).solid }" />
          <AppAvatar v-else :avatar="r.avatar" :size="26" />
          <div style="flex: 1; min-width: 0">
            <p class="small" style="font-weight: 600">{{ r.label }}</p>
            <p v-if="r.sub" class="hint">{{ r.sub }}</p>
          </div>
          <input
            v-if="manual"
            v-model.number="r.manualRank"
            type="number"
            min="1"
            class="input input--compact"
            placeholder="rang"
            :disabled="!r.included"
          />
          <input
            v-else
            v-model.number="r.score"
            type="number"
            class="input input--compact"
            placeholder="pts"
            :disabled="!r.included"
          />
        </li>
      </ul>

      <label class="check" style="margin: 14px 0">
        <input v-model="manual" type="checkbox" />
        Jeu sans points, je classe à la main
      </label>

      <p v-if="formError || error" class="error" style="margin-bottom: 12px">{{ formError || error }}</p>

      <button type="button" class="btn btn--primary btn--block" :disabled="pending" @click="submit">
        <IconTrophy :size="18" />
        Enregistrer le résultat
      </button>
      <p class="hint" style="text-align: center; margin-top: 10px">Le classement se met à jour en tapant les scores.</p>
    </template>
  </div>
</template>

<style scoped>
.game-pick {
  display: flex;
  gap: 12px;
  align-items: center;
  padding: 10px;
}

.game-pick__cover {
  width: 72px;
  flex-shrink: 0;
}

.rows {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.result {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
}

.result--off {
  opacity: 0.55;
}

.result__check {
  width: 18px;
  height: 18px;
  accent-color: var(--accent);
  margin: 0;
}

.rank {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  border-radius: 50%;
  background: var(--surface-2);
  color: var(--text-2);
  font-size: 12px;
  font-weight: 600;
  flex-shrink: 0;
}

.rank--first {
  background: var(--warning-soft);
  color: var(--warning-text);
}

.dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  flex-shrink: 0;
}
</style>
