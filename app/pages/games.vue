<script setup lang="ts">
import { IconChevronRight, IconPhotoOff, IconPlus, IconSearch } from '@tabler/icons-vue'
import type { AddGameSubmit, CatalogueGameDto } from '#shared/types'

const { data: games, refresh } = await useFetch<CatalogueGameDto[]>('/api/games', { default: () => [] })

const filter = ref('')
const addOpen = ref(false)
const editing = ref<CatalogueGameDto | null>(null)
const pending = ref(false)
const error = ref<string | null>(null)

const normalize = (s: string) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')

const visible = computed(() => {
  const q = normalize(filter.value.trim())
  const list = q ? games.value.filter(g => normalize(g.title).includes(q)) : games.value
  return [...list].sort((a, b) => b.playedCount - a.playedCount || a.title.localeCompare(b.title))
})

const withoutCover = computed(() => games.value.filter(g => !g.coverUrl).length)

function extractMessage(e: unknown) {
  const err = e as { data?: { statusMessage?: string; message?: string }; message?: string }
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

async function onAdd(payload: AddGameSubmit) {
  const ok = await run(() =>
    $fetch('/api/games', {
      method: 'POST',
      body: { title: payload.title, rawgId: payload.rawgId, coverUrl: payload.coverUrl },
    }),
  )
  if (ok) addOpen.value = false
}

async function onSave(payload: { title: string; coverUrl: string | null }) {
  if (!editing.value) return
  const ok = await run(() => $fetch(`/api/games/${editing.value!.id}`, { method: 'PATCH', body: payload }))
  if (ok) editing.value = null
}

async function onRemove() {
  if (!editing.value) return
  const ok = await run(() => $fetch(`/api/games/${editing.value!.id}`, { method: 'DELETE' }))
  if (ok) editing.value = null
}
</script>

<template>
  <div>
    <header class="head">
      <div>
        <h1>Jeux</h1>
        <p class="hint">
          {{ plural(games.length, 'jeu', 'jeux') }} dans le catalogue<template v-if="withoutCover"> · {{ withoutCover }} sans jaquette</template>
        </p>
      </div>
      <button type="button" class="btn btn--sm btn--primary" @click="addOpen = true">
        <IconPlus :size="15" />
        Ajouter
      </button>
    </header>

    <div v-if="games.length > 5" class="search">
      <input v-model="filter" class="input" type="search" placeholder="Filtrer les jeux" />
      <IconSearch class="search__icon" :size="18" />
    </div>

    <ul v-if="visible.length" class="list">
      <li v-for="g in visible" :key="g.id">
        <button type="button" class="game" @click="editing = g">
          <GameCover :src="g.coverUrl" :title="g.title" radius="6px" class="game__cover" />
          <div class="game__text">
            <p class="game__title">{{ g.title }}</p>
            <p class="hint">
              {{ g.playedCount ? `joué ${g.playedCount} fois` : 'jamais joué' }} · {{ g.proposedCount ? `proposé ${g.proposedCount} fois` : 'jamais proposé' }}
            </p>
            <span v-if="!g.coverUrl" class="badge" style="margin-top: 4px"><IconPhotoOff :size="11" /> sans jaquette</span>
          </div>
          <IconChevronRight :size="18" style="color: var(--text-3)" />
        </button>
      </li>
    </ul>
    <div v-else class="empty card">
      <h3>{{ filter ? 'Aucun jeu ne correspond' : 'Le catalogue est vide' }}</h3>
      <p class="small">{{ filter ? 'Essaie un autre mot.' : 'Ajoute les jeux que vous avez sous la main.' }}</p>
    </div>

    <button type="button" class="btn btn--dashed btn--block" style="margin-top: 12px" @click="addOpen = true">
      <IconPlus :size="18" />
      Ajouter un jeu
    </button>

    <AddGameSheet :open="addOpen" :pending="pending" :error="error" mode="catalogue" @close="addOpen = false" @submit="onAdd" />
    <EditGameSheet :open="!!editing" :game="editing" :pending="pending" :error="error" @close="editing = null" @save="onSave" @remove="onRemove" />
  </div>
</template>

<style scoped>
.head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 14px;
}

.search {
  position: relative;
  margin-bottom: 12px;
}

.search .input {
  padding-right: 40px;
}

.search__icon {
  position: absolute;
  right: 12px;
  top: 13px;
  color: var(--text-3);
}

.list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.game {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 10px 12px;
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  background: var(--surface);
  color: inherit;
  text-align: left;
}

.game__cover {
  width: 64px;
  flex-shrink: 0;
}

.game__text {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.game__title,
.game__text .hint {
  align-self: stretch;
}

.game__title {
  font-size: 14px;
  font-weight: 600;
}
</style>
