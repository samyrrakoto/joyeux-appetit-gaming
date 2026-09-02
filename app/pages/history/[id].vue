<script setup lang="ts">
import { IconArrowLeft } from '@tabler/icons-vue'
import type { NightDto } from '#shared/types'

const route = useRoute()
const { data: night, error } = await useFetch<NightDto>(`/api/nights/${route.params.id}`)

const saving = ref(false)
async function saveDate(nightDate: string) {
  saving.value = true
  try {
    night.value = await $fetch<NightDto>(`/api/nights/${route.params.id}`, { method: 'PATCH', body: { nightDate } })
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div>
    <header class="page-header">
      <NuxtLink to="/history" class="btn btn--ghost btn--icon" aria-label="Retour"><IconArrowLeft :size="20" /></NuxtLink>
      <div style="flex: 1">
        <h1>{{ night ? formatNightDate(night.nightDate) : 'Soirée' }}</h1>
        <p v-if="night" class="hint">{{ plural(night.players.length, 'joueur') }} · {{ plural(night.matches.length, 'partie') }}</p>
        <NightDateEditor v-if="night" :date="night.nightDate" :pending="saving" label="Changer la date" hide-date @save="saveDate" />
      </div>
    </header>

    <p v-if="error" class="error">Soirée introuvable.</p>

    <template v-if="night">
      <section class="block">
        <h2 class="block__title">Qui était là</h2>
        <div class="row" style="flex-wrap: wrap; gap: 8px">
          <PlayerChip v-for="p in night.players" :key="p.id" :player="p" style="pointer-events: none" />
          <span v-if="!night.players.length" class="hint">Personne n'a voté ni joué.</span>
        </div>
      </section>

      <section class="block">
        <h2 class="block__title">Le sondage</h2>
        <ul class="poll">
          <li v-for="(g, i) in night.games" :key="g.id" class="poll__row">
            <span class="badge" :class="{ 'badge--gold': i === 0 && g.voters.length }">{{ ordinal(i + 1) }}</span>
            <GameCover :src="g.game.coverUrl" :title="g.game.title" radius="4px" class="poll__cover" />
            <span class="small" style="flex: 1; font-weight: 500">{{ g.game.title }}</span>
            <span class="hint">{{ plural(g.voters.length, 'vote') }}</span>
          </li>
          <li v-if="!night.games.length" class="hint">Aucun jeu proposé.</li>
        </ul>
      </section>

      <section v-if="night.teams.length" class="block">
        <h2 class="block__title">Les équipes</h2>
        <div class="teams">
          <div v-for="t in night.teams" :key="t.id" class="team card" :style="{ borderTopColor: teamColor(t.color).solid }">
            <h3 style="font-size: 14px; margin-bottom: 6px">{{ t.name }}</h3>
            <div class="row" style="gap: 4px; flex-wrap: wrap">
              <AppAvatar v-for="m in t.members" :key="m.id" :avatar="m.avatar" :size="24" />
              <span class="hint" style="margin-left: 4px">{{ t.members.map(m => m.name).join(', ') }}</span>
            </div>
          </div>
        </div>
      </section>

      <section class="block">
        <h2 class="block__title">Les parties</h2>
        <ul class="matches">
          <li v-for="m in night.matches" :key="m.id" class="match card">
            <div class="row" style="margin-bottom: 8px">
              <GameCover :src="m.game.coverUrl" :title="m.game.title" radius="6px" class="match__cover" />
              <div style="flex: 1">
                <p class="small" style="font-weight: 600">{{ m.game.title }}</p>
                <p class="hint">{{ formatTime(m.playedAt) }} · {{ m.mode === 'team' ? 'par équipe' : 'solo' }}</p>
              </div>
            </div>
            <ol class="results">
              <li v-for="r in m.results" :key="r.id" class="result">
                <span class="badge" :class="{ 'badge--gold': r.rank === 1 }">{{ ordinal(r.rank) }}</span>
                <span v-if="r.team" class="dot" :style="{ background: teamColor(r.team.color).solid }" />
                <AppAvatar v-else :avatar="r.player?.avatar" :size="22" />
                <span class="small" style="flex: 1">{{ r.team?.name ?? r.player?.name }}</span>
                <span v-if="r.score !== null" class="small" style="font-weight: 600">{{ r.score }}</span>
              </li>
            </ol>
          </li>
          <li v-if="!night.matches.length" class="hint">Aucune partie enregistrée.</li>
        </ul>
      </section>
    </template>
  </div>
</template>

<style scoped>
.block {
  margin-bottom: 22px;
}

.block__title {
  font-size: 15px;
  color: var(--text-2);
  margin-bottom: 10px;
}

.poll {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.poll__row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.poll__cover {
  width: 44px;
  flex-shrink: 0;
}

.teams {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.team {
  border-top: 3px solid;
  border-radius: 0 0 var(--radius-lg) var(--radius-lg);
  padding: 10px;
}

.matches {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.match {
  padding: 10px 12px;
}

.match__cover {
  width: 48px;
  flex-shrink: 0;
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
  width: 12px;
  height: 12px;
  border-radius: 50%;
}
</style>
