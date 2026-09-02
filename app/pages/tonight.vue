<script setup lang="ts">
import { IconDeviceGamepad2, IconDoorExit, IconLayoutGrid, IconList, IconRefresh, IconTrash, IconTrophy, IconUsersGroup } from '@tabler/icons-vue'
import type { GameSort, NightGameDto } from '#shared/types'

const SORT_KEY = 'joyeux-appetit-gaming:sort'
const VIEW_KEY = 'joyeux-appetit-gaming:view'
type GameView = 'grid' | 'list'
const SORTS: { value: GameSort; label: string }[] = [
  { value: 'votes', label: 'Votes' },
  { value: 'played', label: 'Joués' },
  { value: 'alpha-asc', label: 'A→Z' },
  { value: 'alpha-desc', label: 'Z→A' },
]

const { player } = usePlayer()
const { night, pending, error, refresh, toggleVote, setPlayed, setStatus, setDate, deleteMatch, myVotes } = useNight({ poll: true })
await refresh()

const sort = ref<GameSort>((localStorage.getItem(SORT_KEY) as GameSort | null) ?? 'votes')
watch(sort, s => localStorage.setItem(SORT_KEY, s))

const view = ref<GameView>(localStorage.getItem(VIEW_KEY) === 'list' ? 'list' : 'grid')
watch(view, v => localStorage.setItem(VIEW_KEY, v))

const playedOpen = ref(false)

const others = computed(() => (night.value?.players ?? []).filter(p => p.id !== player.value?.id))

const byTitle = (a: NightGameDto, b: NightGameDto) => a.game.title.localeCompare(b.game.title, 'fr')

const sortedGames = computed(() => {
  const list = [...(night.value?.games ?? [])]
  switch (sort.value) {
    case 'played':
      return list.sort((a, b) => b.game.playedCount - a.game.playedCount || byTitle(a, b))
    case 'alpha-asc':
      return list.sort(byTitle)
    case 'alpha-desc':
      return list.sort((a, b) => byTitle(b, a))
    default:
      return list.sort((a, b) => b.voters.length - a.voters.length || b.game.playedCount - a.game.playedCount || byTitle(a, b))
  }
})

/** Rang dans le classement des votes, affiché seulement quand on trie par votes. */
const voteRank = computed(() => {
  const ranks = new Map<string, number>()
  if (sort.value !== 'votes') return ranks
  sortedGames.value.forEach((g, i) => ranks.set(g.game.id, i + 1))
  return ranks
})

const playedTonight = computed(() => (night.value?.games ?? []).filter(g => g.playedTonight))

async function onSavePlayed(gameIds: string[]) {
  await setPlayed(gameIds)
  playedOpen.value = false
}

async function removeMatch(matchId: string, title: string) {
  if (!confirm(`Supprimer cette partie de ${title} ? Les scores saisis seront perdus.`)) return
  await deleteMatch(matchId)
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

    <div v-if="night.games.length" class="toolbar">
      <div class="segmented" style="flex: 1" role="tablist" aria-label="Tri des jeux">
        <button
          v-for="s in SORTS"
          :key="s.value"
          type="button"
          class="segmented__item"
          :class="{ 'segmented__item--active': sort === s.value }"
          @click="sort = s.value"
        >
          {{ s.label }}
        </button>
      </div>
      <div class="segmented" role="tablist" aria-label="Affichage des jeux">
        <button
          type="button"
          class="segmented__item segmented__item--icon"
          :class="{ 'segmented__item--active': view === 'grid' }"
          aria-label="Vue grille"
          title="Vue grille"
          @click="view = 'grid'"
        >
          <IconLayoutGrid :size="16" />
        </button>
        <button
          type="button"
          class="segmented__item segmented__item--icon"
          :class="{ 'segmented__item--active': view === 'list' }"
          aria-label="Vue liste"
          title="Vue liste"
          @click="view = 'list'"
        >
          <IconList :size="16" />
        </button>
      </div>
    </div>

    <div v-if="night.games.length && view === 'grid'" class="grid">
      <GameCard
        v-for="item in sortedGames"
        :key="item.game.id"
        :item="item"
        :rank="voteRank.get(item.game.id) ?? null"
        :voted="myVotes.has(item.game.id)"
        :disabled="pending || night.status === 'closed'"
        @toggle="toggleVote(item.game.id)"
      />
    </div>
    <ul v-else-if="night.games.length" class="list">
      <GameRow
        v-for="item in sortedGames"
        :key="item.game.id"
        :item="item"
        :rank="voteRank.get(item.game.id) ?? null"
        :show-rank="sort === 'votes'"
        :voted="myVotes.has(item.game.id)"
        :disabled="pending || night.status === 'closed'"
        @toggle="toggleVote(item.game.id)"
      />
    </ul>
    <div v-else class="empty card">
      <h3>Le catalogue est vide</h3>
      <p class="small">Ajoute vos jeux dans l’onglet Jeux, ils seront tous en lice chaque soir.</p>
      <NuxtLink to="/games" class="btn btn--sm" style="margin-top: 10px">Ouvrir le catalogue</NuxtLink>
    </div>

    <p v-if="night.games.length" class="hint" style="text-align: center; margin-top: 10px">
      Il manque un jeu ? <NuxtLink to="/games" style="color: var(--accent)">Ajoute-le au catalogue</NuxtLink>, il apparaîtra ici.
    </p>

    <section class="section">
      <div class="title-row">
        <h2>Ce soir on a joué à</h2>
        <button type="button" class="btn btn--sm" @click="playedOpen = true">
          <IconDeviceGamepad2 :size="15" />
          Cocher
        </button>
      </div>
      <div v-if="playedTonight.length" class="played">
        <span v-for="g in playedTonight" :key="g.game.id" class="badge badge--success">{{ g.game.title }}</span>
      </div>
      <p v-else class="hint">Rien de coché pour l’instant. En fin de soirée, coche les jeux réellement joués.</p>
    </section>

    <section class="section">
      <div class="title-row">
        <h2>Parties et scores</h2>
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
          <button type="button" class="btn btn--ghost btn--icon" style="width: 32px; height: 32px; color: var(--text-3)" aria-label="Supprimer la partie" @click="removeMatch(m.id, m.game.title)">
            <IconTrash :size="15" />
          </button>
        </li>
      </ul>
      <p v-else class="hint" style="margin-bottom: 12px">Aucun score enregistré pour l’instant.</p>

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

    <PlayedGamesSheet :open="playedOpen" :games="night.games" :pending="pending" :error="error" @close="playedOpen = false" @save="onSavePlayed" />
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

.toolbar {
  display: flex;
  gap: 6px;
  margin-bottom: 12px;
}

.segmented__item--icon {
  flex: none;
  width: 34px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.section {
  margin-top: 28px;
}

.played {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
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
