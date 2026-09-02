<script setup lang="ts">
import { IconCheck, IconPlus, IconRefresh, IconSearch } from '@tabler/icons-vue'
import type { RawgSuggestion } from '#shared/types'

const props = defineProps<{ open: boolean; pending?: boolean }>()
const emit = defineEmits<{
  close: []
  submit: [payload: { title: string; rawgId: number | null; coverUrl: string | null; voteNow: boolean }]
}>()

const query = ref('')
const suggestions = ref<RawgSuggestion[]>([])
const searching = ref(false)
const rawgConfigured = ref(true)
const picked = ref<RawgSuggestion | null>(null)
const voteNow = ref(true)
const error = ref('')

let debounce: ReturnType<typeof setTimeout> | undefined

watch(query, q => {
  error.value = ''
  clearTimeout(debounce)
  if (q.trim().length < 2) {
    suggestions.value = []
    return
  }
  debounce = setTimeout(search, 300)
})

watch(
  () => props.open,
  open => {
    if (!open) return
    query.value = ''
    suggestions.value = []
    picked.value = null
    voteNow.value = true
    error.value = ''
  },
)

async function search() {
  searching.value = true
  try {
    const res = await $fetch<{ configured: boolean; results: RawgSuggestion[] }>('/api/games/search', {
      query: { q: query.value },
    })
    rawgConfigured.value = res.configured
    suggestions.value = res.results
  } finally {
    searching.value = false
  }
}

function pick(s: RawgSuggestion) {
  picked.value = s
}

function useFreeTitle() {
  if (query.value.trim().length < 1) {
    error.value = 'Entre un titre'
    return
  }
  picked.value = { rawgId: 0, title: query.value.trim(), released: null, platforms: [], coverUrl: null }
}

function submit() {
  if (!picked.value) return
  emit('submit', {
    title: picked.value.title,
    rawgId: picked.value.rawgId || null,
    coverUrl: picked.value.coverUrl,
    voteNow: voteNow.value,
  })
}
</script>

<template>
  <BottomSheet :open="open" title="Proposer un jeu" @close="emit('close')">
    <template v-if="!picked">
      <div>
        <label class="label" for="game-title">Titre du jeu</label>
        <div class="search">
          <input
            id="game-title"
            v-model="query"
            class="input"
            type="text"
            placeholder="Mario Kart, Overcooked, Jackbox…"
            autocomplete="off"
            autofocus
            @keydown.enter.prevent="suggestions[0] ? pick(suggestions[0]) : useFreeTitle()"
          />
          <IconSearch class="search__icon" :size="18" />
        </div>
        <p v-if="error" class="error" style="margin-top: 6px">{{ error }}</p>
      </div>

      <ul v-if="suggestions.length" class="suggestions">
        <li v-for="s in suggestions" :key="s.rawgId">
          <button type="button" class="suggestion" @click="pick(s)">
            <GameCover :src="s.coverUrl" :title="s.title" ratio="4 / 3" radius="6px" class="suggestion__cover" />
            <span class="suggestion__text">
              <span class="suggestion__title">{{ s.title }}</span>
              <span class="hint">
                {{ [s.released?.slice(0, 4), s.platforms.join(', ')].filter(Boolean).join(' · ') }}
              </span>
            </span>
          </button>
        </li>
      </ul>

      <p v-else-if="searching" class="hint">Recherche en cours…</p>
      <p v-else-if="!rawgConfigured && query.length >= 2" class="hint">
        Clé RAWG absente : la jaquette ne sera pas récupérée, mais tu peux ajouter le titre tel quel.
      </p>

      <button
        v-if="query.trim().length"
        type="button"
        class="btn btn--dashed btn--block"
        @click="useFreeTitle"
      >
        <IconPlus :size="16" />
        Ajouter « {{ query.trim() }} » sans jaquette
      </button>
    </template>

    <template v-else>
      <div class="preview">
        <GameCover :src="picked.coverUrl" :title="picked.title" ratio="4 / 3" radius="8px" class="preview__cover" />
        <div class="preview__text">
          <h3>{{ picked.title }}</h3>
          <p v-if="picked.released || picked.platforms.length" class="hint">
            {{ [picked.released?.slice(0, 4), picked.platforms.join(', ')].filter(Boolean).join(' · ') }}
          </p>
          <span v-if="picked.coverUrl" class="badge badge--success" style="margin-top: 8px">
            <IconCheck :size="12" />
            Jaquette récupérée
          </span>
          <span v-else class="badge" style="margin-top: 8px">Sans jaquette</span>
          <button type="button" class="btn btn--ghost btn--sm preview__change" @click="picked = null">
            <IconRefresh :size="14" />
            Pas le bon ? Changer
          </button>
        </div>
      </div>

      <label class="check">
        <input v-model="voteNow" type="checkbox" />
        Voter pour ce jeu tout de suite
      </label>

      <div class="row">
        <button type="button" class="btn" style="flex: 1" @click="picked = null">Retour</button>
        <button type="button" class="btn btn--primary" style="flex: 2" :disabled="pending" @click="submit">
          <IconPlus :size="16" />
          Ajouter au sondage
        </button>
      </div>
    </template>
  </BottomSheet>
</template>

<style scoped>
.search {
  position: relative;
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

.suggestions {
  list-style: none;
  margin: 0;
  padding: 0;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  overflow: hidden;
}

.suggestions li + li {
  border-top: 1px solid var(--border);
}

.suggestion {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 8px 10px;
  border: none;
  background: var(--surface);
  text-align: left;
  color: inherit;
}

.suggestion:hover {
  background: var(--surface-2);
}

.suggestion__cover {
  width: 56px;
  flex-shrink: 0;
}

.suggestion__text {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.suggestion__title {
  font-size: 14px;
  font-weight: 500;
}

.preview {
  display: flex;
  gap: 14px;
  align-items: flex-start;
}

.preview__cover {
  width: 130px;
  flex-shrink: 0;
}

.preview__text {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  flex: 1;
}

.preview__change {
  margin-top: 8px;
  padding: 0;
  color: var(--accent);
}
</style>
