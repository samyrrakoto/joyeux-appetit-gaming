<script setup lang="ts">
import { IconArrowLeft, IconCrown, IconEdit, IconTrash, IconTrophy } from '@tabler/icons-vue'
import type { GameDetailDto, GameMatchDto, NightDto } from '#shared/types'

const route = useRoute()
const id = route.params.id as string

const { data: detail, error: loadError, refresh } = await useFetch<GameDetailDto>(`/api/games/${id}/detail`)

const editing = ref(false)
const pending = ref(false)
const error = ref<string | null>(null)

const byNight = computed(() => {
  const groups = new Map<string, { nightId: string; nightDate: string; matches: GameMatchDto[] }>()
  for (const m of detail.value?.matches ?? []) {
    const g = groups.get(m.nightId) ?? { nightId: m.nightId, nightDate: m.nightDate, matches: [] }
    g.matches.push(m)
    groups.set(m.nightId, g)
  }
  return [...groups.values()]
})

function extractMessage(e: unknown) {
  const err = e as { data?: { statusMessage?: string }; message?: string }
  return err.data?.statusMessage ?? err.message ?? 'Une erreur est survenue'
}

async function run(fn: () => Promise<unknown>) {
  pending.value = true
  error.value = null
  try {
    await fn()
    await refresh()
    return true
  } catch (e) {
    error.value = extractMessage(e)
    return false
  } finally {
    pending.value = false
  }
}

async function onSave(payload: { title: string; coverUrl: string | null }) {
  const ok = await run(() => $fetch(`/api/games/${id}`, { method: 'PATCH', body: payload }))
  if (ok) editing.value = false
}

async function onRemove() {
  const ok = await run(() => $fetch(`/api/games/${id}`, { method: 'DELETE' }))
  if (ok) await navigateTo('/games')
}

async function removeMatch(m: GameMatchDto) {
  if (!confirm(`Supprimer cette partie du ${formatNightDate(m.nightDate).toLowerCase()} ? Les scores saisis seront perdus.`)) return
  await run(() => $fetch<NightDto>(`/api/nights/${m.nightId}/matches/${m.id}`, { method: 'DELETE' }))
}
</script>

<template>
  <div>
    <header class="page-header">
      <NuxtLink to="/games" class="btn btn--ghost btn--icon" aria-label="Retour au catalogue"><IconArrowLeft :size="20" /></NuxtLink>
      <h1 style="flex: 1">{{ detail?.game.title ?? 'Jeu' }}</h1>
      <button v-if="detail" type="button" class="btn btn--ghost btn--icon" aria-label="Modifier le jeu" @click="editing = true">
        <IconEdit :size="20" />
      </button>
    </header>

    <p v-if="loadError" class="error">Jeu introuvable.</p>

    <template v-if="detail">
      <div class="hero card">
        <GameCover :src="detail.game.coverUrl" :title="detail.game.title" radius="8px" class="hero__cover" />
        <div class="hero__text">
          <p class="hint">{{ detail.game.playedCount ? `Joué ${detail.game.playedCount} fois` : 'Jamais joué' }}</p>
          <p class="hint">{{ plural(detail.matches.length, 'partie') }} avec scores</p>
          <NuxtLink :to="{ path: '/match', query: { game: detail.game.id } }" class="btn btn--primary btn--sm" style="margin-top: 10px">
            <IconTrophy :size="15" />
            Enregistrer un score
          </NuxtLink>
        </div>
      </div>

      <div class="tiles" style="margin: 14px 0 18px">
        <div class="tile"><p class="tile__label">Soirées</p><p class="tile__value">{{ detail.nightsCount }}</p></div>
        <div class="tile"><p class="tile__label">Parties</p><p class="tile__value">{{ detail.matches.length }}</p></div>
        <div class="tile">
          <p class="tile__label">Champion</p>
          <p v-if="detail.topWinner" class="tile__value tile__value--small">
            <span v-if="detail.topWinner.kind === 'team'" class="dot" :style="{ background: teamColor(detail.topWinner.color ?? 'coral').solid }" />
            <AppAvatar v-else :avatar="detail.topWinner.avatar" :size="20" />
            {{ detail.topWinner.label }}
          </p>
          <p v-else class="tile__value" style="color: var(--text-3)">–</p>
        </div>
      </div>

      <p v-if="error" class="error" style="margin-bottom: 12px">{{ error }}</p>

      <h2 style="font-size: 15px; color: var(--text-2); margin-bottom: 10px">Historique des parties</h2>

      <div v-if="byNight.length" class="stack" style="gap: 14px">
        <section v-for="group in byNight" :key="group.nightId">
          <NuxtLink :to="`/history/${group.nightId}`" class="night-link">{{ formatNightDate(group.nightDate) }}</NuxtLink>
          <ul class="matches">
            <li v-for="m in group.matches" :key="m.id" class="match card">
              <div class="match__head">
                <span class="hint">{{ formatTime(m.playedAt) }} · {{ m.mode === 'team' ? 'par équipe' : 'solo' }}</span>
                <button type="button" class="btn btn--ghost btn--icon" style="width: 28px; height: 28px; color: var(--text-3)" aria-label="Supprimer la partie" :disabled="pending" @click="removeMatch(m)">
                  <IconTrash :size="14" />
                </button>
              </div>
              <ol class="results">
                <li v-for="r in m.results" :key="r.id" class="result">
                  <span class="badge" :class="{ 'badge--gold': r.rank === 1 }">
                    <IconCrown v-if="r.rank === 1" :size="11" />
                    {{ ordinal(r.rank) }}
                  </span>
                  <span v-if="r.team" class="dot" :style="{ background: teamColor(r.team.color).solid }" />
                  <AppAvatar v-else :avatar="r.player?.avatar" :size="22" />
                  <span class="small" style="flex: 1; min-width: 0">
                    {{ r.team?.name ?? r.player?.name }}
                    <span v-if="r.team" class="hint"> · {{ r.team.members.map(p => p.name).join(', ') }}</span>
                  </span>
                  <span v-if="r.score !== null" class="small" style="font-weight: 600">{{ r.score }}</span>
                </li>
              </ol>
            </li>
          </ul>
        </section>
      </div>
      <div v-else class="empty card">
        <h3>Aucun score pour ce jeu</h3>
        <p class="small">Enregistre la prochaine partie, elle apparaîtra ici avec ses équipes et ses scores.</p>
      </div>

      <EditGameSheet :open="editing" :game="detail.game" :pending="pending" :error="error" @close="editing = false" @save="onSave" @remove="onRemove" />
    </template>
  </div>
</template>

<style scoped>
.hero {
  display: flex;
  gap: 14px;
  align-items: flex-start;
  padding: 12px;
}

.hero__cover {
  width: 120px;
  flex-shrink: 0;
}

.hero__text {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
}

.tile__value--small {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 15px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.night-link {
  display: inline-block;
  font-size: 13px;
  font-weight: 600;
  color: var(--text-2);
  margin-bottom: 6px;
}

.matches {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.match {
  padding: 8px 12px 10px;
}

.match__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 4px;
}

.results {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.result {
  display: flex;
  align-items: center;
  gap: 8px;
}

.dot {
  display: inline-block;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  flex-shrink: 0;
}
</style>
