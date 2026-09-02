<script setup lang="ts">
import { IconCheck, IconTrash } from '@tabler/icons-vue'
import type { CatalogueGameDto } from '#shared/types'

const props = defineProps<{
  open: boolean
  game: CatalogueGameDto | null
  pending?: boolean
  error?: string | null
}>()
const emit = defineEmits<{
  close: []
  save: [payload: { title: string; coverUrl: string | null }]
  remove: []
}>()

const title = ref('')
const coverUrl = ref('')
const localError = ref('')

watch(
  () => [props.open, props.game?.id] as const,
  ([open]) => {
    if (!open || !props.game) return
    title.value = props.game.title
    coverUrl.value = props.game.coverUrl ?? ''
    localError.value = ''
  },
  { immediate: true },
)

const previewUrl = computed(() => {
  const url = coverUrl.value.trim()
  return /^https?:\/\/\S+$/i.test(url) ? url : null
})
const coverInvalid = computed(() => coverUrl.value.trim().length > 0 && !previewUrl.value)
const deletable = computed(() => props.game && !props.game.playedCount)

function save() {
  localError.value = ''
  if (!title.value.trim()) {
    localError.value = 'Entre un titre'
    return
  }
  if (coverInvalid.value) return
  emit('save', { title: title.value.trim(), coverUrl: previewUrl.value })
}

function remove() {
  if (!props.game) return
  if (!confirm(`Supprimer « ${props.game.title} » du catalogue ?`)) return
  emit('remove')
}
</script>

<template>
  <BottomSheet :open="open" title="Modifier le jeu" @close="emit('close')">
    <form v-if="game" class="stack" style="gap: 14px" @submit.prevent="save">
      <div class="preview">
        <GameCover :src="previewUrl" :title="title" radius="8px" class="preview__cover" />
        <div class="preview__text">
          <p class="hint">{{ game.playedCount ? `Joué ${game.playedCount} fois` : 'Jamais joué' }}</p>
          <span v-if="game.rawgId" class="badge" style="margin-top: 6px">Fiche RAWG liée</span>
          <span v-else class="badge" style="margin-top: 6px">Ajouté à la main</span>
        </div>
      </div>

      <div>
        <label class="label" for="edit-title">Titre</label>
        <input id="edit-title" v-model="title" class="input" maxlength="120" />
      </div>

      <CoverUrlField
        v-model="coverUrl"
        :label="game.coverUrl ? 'Lien de la jaquette' : 'Lien vers une jaquette'"
        hint="Laisse vide pour retirer la jaquette."
      />

      <p v-if="localError || error" class="error">{{ localError || error }}</p>

      <div class="row">
        <button type="button" class="btn" style="flex: 1" @click="emit('close')">Annuler</button>
        <button type="submit" class="btn btn--primary" style="flex: 2" :disabled="pending || coverInvalid">
          <IconCheck :size="16" />
          Enregistrer
        </button>
      </div>

      <button v-if="deletable" type="button" class="btn btn--ghost btn--block" style="color: var(--danger-text)" :disabled="pending" @click="remove">
        <IconTrash :size="16" />
        Supprimer du catalogue
      </button>
      <p v-else class="hint" style="text-align: center">Ce jeu fait partie de l’historique, il ne peut pas être supprimé.</p>
    </form>
  </BottomSheet>
</template>

<style scoped>
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
  padding-top: 4px;
}
</style>
