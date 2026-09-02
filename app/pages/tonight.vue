<script setup lang="ts">
import { IconDoorExit, IconPlus, IconRefresh, IconTrophy, IconUsersGroup } from '@tabler/icons-vue'
import type { AddGameSubmit } from '#shared/types'

const { player } = usePlayer()
const { night, pending, error, refresh, toggleVote, addGame, setStatus, setDate, myVotes } = useNight({ poll: true })
await refresh()

const sheetOpen = ref(false)

const others = computed(() => (night.value?.players ?? []).filter(p => p.id !== player.value?.id))

async function onAddGame(payload: AddGameSubmit) {
  await addGame(payload)
  sheetOpen.value = false
}

async function closeNight() {
  if (!confirm('Clore la soirée ? Les votes seront figés et une nouvelle soirée démarrera à la prochaine visite.')) return
  await setStatus('closed')
  await refresh()
}
</script>

<template>
  <div v-if="night">
    <header class="top">
      <div class="row">
        <AppAvatar :avatar="player?.avatar" :size="32" />
        <div>
          <p class="small" style="font-weight: 600">{{ player?.name }}</p>
          <p class="hint">{{ myVotes.size ? plural(myVotes.size, 'vote utilisé', 'votes utilisés') : 'Pas encore voté' }}</p>
        </div>
      </div>
      <div v-if="others.length" class="avatar-stack">
        <AppAvatar v-for="p in others.slice(0, 4)" :key="p.id" :avatar="p.avatar" :size="26" />
        <span v-if="others.length > 4" class="more">+{{ others.length - 4 }}</span>
      </div>
    </header>

    <div class="title-row">
      <div>
        <h1>On joue à quoi ce soir ?</h1>
        <NightDateEditor :date="night.nightDate" :pending="pending" @save="setDate" />
      </div>
      <span class="hint row" style="gap: 4px"><IconRefresh :size="13" /> en direct</span>
    </div>

    <p v-if="error" class="error" style="margin-bottom: 12px">{{ error }}</p>

    <div v-if="night.games.length" class="grid">
      <GameCard
        v-for="(item, i) in night.games"
        :key="item.id"
        :item="item"
        :rank="i + 1"
        :voted="myVotes.has(item.id)"
        :disabled="pending || night.status === 'closed'"
        @toggle="toggleVote(item.id)"
      />
    </div>
    <div v-else class="empty card">
      <h3>Aucun jeu proposé</h3>
      <p class="small">Sois le premier à lancer une idée pour ce soir.</p>
    </div>

    <button type="button" class="btn btn--dashed btn--block" style="margin-top: 12px" @click="sheetOpen = true">
      <IconPlus :size="18" />
      Proposer un jeu
    </button>

    <section class="section">
      <div class="title-row">
        <h2>Parties du soir</h2>
        <span v-if="night.teams.length" class="hint">{{ plural(night.teams.length, 'équipe') }}</span>
      </div>

      <ul v-if="night.matches.length" class="matches">
        <li v-for="m in night.matches" :key="m.id" class="match card">
          <GameCover :src="m.game.coverUrl" :title="m.game.title" radius="6px" class="match__cover" />
          <div style="flex: 1; min-width: 0">
            <p class="small" style="font-weight: 600">{{ m.game.title }}</p>
            <p class="hint">
              {{ formatTime(m.playedAt) }} ·
              <template v-for="(r, idx) in m.results.slice(0, 3)" :key="r.id">
                <span v-if="idx" style="margin: 0 2px">·</span>
                <span :style="r.rank === 1 ? 'font-weight:600;color:var(--warning-text)' : ''">
                  {{ ordinal(r.rank) }} {{ r.team?.name ?? r.player?.name }}<template v-if="r.score !== null"> ({{ r.score }})</template>
                </span>
              </template>
            </p>
          </div>
        </li>
      </ul>
      <p v-else class="hint" style="margin-bottom: 12px">Aucune partie enregistrée pour l'instant.</p>

      <div class="row">
        <NuxtLink to="/teams" class="btn" style="flex: 1">
          <IconUsersGroup :size="18" />
          Équipes
        </NuxtLink>
        <NuxtLink to="/match" class="btn btn--primary" style="flex: 1">
          <IconTrophy :size="18" />
          Résultat
        </NuxtLink>
      </div>
    </section>

    <button type="button" class="btn btn--ghost btn--block" style="margin-top: 24px" @click="closeNight">
      <IconDoorExit :size="16" />
      Clore la soirée
    </button>

    <AddGameSheet :open="sheetOpen" :pending="pending" @close="sheetOpen = false" @submit="onAddGame" />
  </div>
</template>

<style scoped>
.top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.more {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  border-radius: 50%;
  background: var(--surface-2);
  font-size: 11px;
  font-weight: 600;
  color: var(--text-2);
}

.title-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 12px;
}

.grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.section {
  margin-top: 28px;
}

.matches {
  list-style: none;
  padding: 0;
  margin: 0 0 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.match {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
}

.match__cover {
  width: 52px;
  flex-shrink: 0;
}
</style>
