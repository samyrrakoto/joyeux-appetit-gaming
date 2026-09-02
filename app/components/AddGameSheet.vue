<script setup lang="ts">
import { IconBooks, IconCheck, IconPlus, IconRefresh, IconSearch } from '@tabler/icons-vue'
import type { AddGameSubmit, CatalogueGameDto, RawgSuggestion } from '#shared/types'

interface Picked {
  source: 'catalogue' | 'rawg' | 'free'
  gameId: string | null
  rawgId: number | null
  title: string
  coverUrl: string | null
  meta: string
}

const props = withDefaults(
  defineProps<{
    open: boolean
    pending?: boolean
    mode?: 'night' | 'catalogue'
    error?: string | null
  }>(),
  { pending: false, mode: 'night', error: null },
)
const emit = defineEmits<{ close: []; submit: [payload: AddGameSubmit] }>()

const query = ref('')
const suggestions = ref<RawgSuggestion[]>([])
const searching = ref(false)
const rawgConfigured = ref(true)
const catalogue = ref<CatalogueGameDto[]>([])
const picked = ref<Picked | null>(null)
const manualCover = ref('')
const voteNow = ref(true)
const localError = ref('')

let debounce: ReturnType<typeof setTimeout> | undefined

const normalize = (s: string) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')

const catalogueMatches = computed(() => {
  const q = normalize(query.value.trim())
  if (q.length < 2) return []
  return catalogue.value.filter(g => normalize(g.title).includes(q)).slice(0, 4)
})

const rawgResults = computed(() => {
  const known = new Set(catalogue.value.map(g => g.rawgId).filter(Boolean))
  return suggestions.value.filter(s => !known.has(s.rawgId))
})

const effectiveCover = computed(() => {
  if (!picked.value) return null
  if (picked.value.coverUrl) return picked.value.coverUrl
  const url = manualCover.value.trim()
  return /^https?:\/\/\S+$/i.test(url) ? url : null
})

const manualCoverInvalid = computed(
  () => manualCover.value.trim().length > 0 && !/^https?:\/\/\S+$/i.test(manualCover.value.trim()),
)

watch(query, q => {
  localError.value = ''
  clearTimeout(debounce)
  if (q.trim().length < 2) {
    suggestions.value = []
    return
  }
  debounce = setTimeout(searchRawg, 300)
})

watch(
  () => props.open,
  async open => {
    if (!open) return
    query.value = ''
    suggestions.value = []
    picked.value = null
    manualCover.value = ''
    voteNow.value = true
    localError.value = ''
    catalogue.value = await $fetch<CatalogueGameDto[]>('/api/games').catch(() => [])
  },
)

async function searchRawg() {
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

function pickCatalogue(g: CatalogueGameDto) {
  picked.value = {
    source: 'catalogue',
    gameId: g.id,
    rawgId: g.rawgId,
    title: g.title,
    coverUrl: g.coverUrl,
    meta: g.playedCount ? `Déjà joué ${g.playedCount} fois` : 'Dans le catalogue',
  }
}

function pickRawg(s: RawgSuggestion) {
  picked.value = {
    source: 'rawg',
    gameId: null,
    rawgId: s.rawgId,
    title: s.title,
    coverUrl: s.coverUrl,
    meta: [s.released?.slice(0, 4), s.platforms.join(', ')].filter(Boolean).join(' · '),
  }
}

function pickFree() {
  const title = query.value.trim()
  if (!title) {
    localError.value = 'Entre un titre'
    return
  }
  picked.value = { source: 'free', gameId: null, rawgId: null, title, coverUrl: null, meta: 'Ajouté à la main' }
}

function submit() {
  if (!picked.value || manualCoverInvalid.value) return
  emit('submit', {
    gameId: picked.value.gameId,
    title: picked.value.title,
    rawgId: picked.value.rawgId,
    coverUrl: effectiveCover.value,
    voteNow: props.mode === 'night' && voteNow.value,
  })
}

const title = computed(() => (props.mode === 'night' ? 'Proposer un jeu' : 'Ajouter un jeu au catalogue'))
</script>

<template>
  <BottomSheet :open="open" :title="title" @close="emit('close')">
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
            @keydown.enter.prevent="catalogueMatches[0] && mode === 'night' ? pickCatalogue(catalogueMatches[0]) : rawgResults[0] ? pickRawg(rawgResults[0]) : pickFree()"
          />
          <IconSearch class="search__icon" :size="18" />
        </div>
        <p v-if="localError" class="error" style="margin-top: 6px">{{ localError }}</p>
      </div>

      <div v-if="catalogueMatches.length">
        <p class="group-label"><IconBooks :size="13" /> {{ mode === 'night' ? 'Dans le catalogue' : 'Déjà dans le catalogue' }}</p>
        <ul class="suggestions">
          <li v-for="g in catalogueMatches" :key="g.id">
            <button type="button" class="suggestion" :disabled="mode === 'catalogue'" @click="pickCatalogue(g)">
              <GameCover :src="g.coverUrl" :title="g.title" radius="6px" class="suggestion__cover" />
              <span class="suggestion__text">
                <span class="suggestion__title">{{ g.title }}</span>
                <span class="hint">{{ g.playedCount ? `joué ${g.playedCount} fois` : g.proposedCount ? `proposé ${g.proposedCount} fois` : 'jamais joué' }}</span>
              </span>
            </button>
          </li>
        </ul>
      </div>

      <div v-if="rawgResults.length">
        <p v-if="catalogueMatches.length" class="group-label"><IconSearch :size="13" /> Nouveaux jeux</p>
        <ul class="suggestions">
          <li v-for="s in rawgResults" :key="s.rawgId">
            <button type="button" class="suggestion" @click="pickRawg(s)">
              <GameCover :src="s.coverUrl" :title="s.title" radius="6px" class="suggestion__cover" />
              <span class="suggestion__text">
                <span class="suggestion__title">{{ s.title }}</span>
                <span class="hint">{{ [s.released?.slice(0, 4), s.platforms.join(', ')].filter(Boolean).join(' · ') }}</span>
              </span>
            </button>
          </li>
        </ul>
      </div>

      <p v-if="searching && !rawgResults.length" class="hint">Recherche en cours…</p>
      <p v-else-if="!rawgConfigured && query.length >= 2" class="hint">
        Clé RAWG absente : pas de recherche automatique, mais tu pourras coller un lien de jaquette à l’étape suivante.
      </p>

      <button v-if="query.trim().length" type="button" class="btn btn--dashed btn--block" @click="pickFree">
        <IconPlus :size="16" />
        Ajouter « {{ query.trim() }} » à la main
      </button>
    </template>

    <template v-else>
      <div class="preview">
        <GameCover :src="effectiveCover" :title="picked.title" radius="8px" class="preview__cover" />
        <div class="preview__text">
          <h3>{{ picked.title }}</h3>
          <p v-if="picked.meta" class="hint">{{ picked.meta }}</p>
          <span v-if="picked.coverUrl" class="badge badge--success" style="margin-top: 8px">
            <IconCheck :size="12" />
            Jaquette récupérée
          </span>
          <span v-else-if="effectiveCover" class="badge badge--success" style="margin-top: 8px">
            <IconCheck :size="12" />
            Jaquette via ton lien
          </span>
          <span v-else class="badge" style="margin-top: 8px">Sans jaquette</span>
          <button type="button" class="btn btn--ghost btn--sm preview__change" @click="picked = null">
            <IconRefresh :size="14" />
            Pas le bon ? Changer
          </button>
        </div>
      </div>

      <CoverUrlField v-if="!picked.coverUrl && picked.source !== 'catalogue'" v-model="manualCover" />
      <p v-else-if="!picked.coverUrl" class="hint">Ce jeu n’a pas de jaquette : tu peux en ajouter une depuis l’onglet Jeux.</p>

      <label v-if="mode === 'night'" class="check">
        <input v-model="voteNow" type="checkbox" />
        Voter pour ce jeu tout de suite
      </label>

      <p v-if="error" class="error">{{ error }}</p>

      <div class="row">
        <button type="button" class="btn" style="flex: 1" @click="picked = null">Retour</button>
        <button type="button" class="btn btn--primary" style="flex: 2" :disabled="pending || manualCoverInvalid" @click="submit">
          <IconPlus :size="16" />
          {{ mode === 'night' ? 'Ajouter au sondage' : 'Ajouter au catalogue' }}
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

.group-label {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  font-weight: 600;
  color: var(--text-2);
  margin-bottom: 6px;
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

.suggestion:hover:not(:disabled) {
  background: var(--surface-2);
}

.suggestion:disabled {
  cursor: default;
  opacity: 0.7;
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
