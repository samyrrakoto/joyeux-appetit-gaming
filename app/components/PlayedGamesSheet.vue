<script setup lang="ts">
import { IconCheck } from '@tabler/icons-vue'
import type { NightGameDto } from '#shared/types'

const props = defineProps<{
  open: boolean
  games: NightGameDto[]
  pending?: boolean
  error?: string | null
}>()
const emit = defineEmits<{ close: []; save: [gameIds: string[]] }>()

const selected = ref(new Set<string>())

watch(
  () => props.open,
  open => {
    if (open) selected.value = new Set(props.games.filter(g => g.playedTonight).map(g => g.game.id))
  },
  { immediate: true },
)

const ordered = computed(() =>
  [...props.games].sort(
    (a, b) =>
      Number(selected.value.has(b.game.id)) - Number(selected.value.has(a.game.id)) ||
      b.voters.length - a.voters.length ||
      a.game.title.localeCompare(b.game.title, 'fr'),
  ),
)

function toggle(id: string) {
  const next = new Set(selected.value)
  if (next.has(id)) next.delete(id)
  else next.add(id)
  selected.value = next
}
</script>

<template>
  <BottomSheet :open="open" title="Jeux joués ce soir" @close="emit('close')">
    <p class="hint">Coche ce à quoi vous avez vraiment joué. C’est ce qui alimente le compteur « joué x fois ».</p>

    <ul class="list">
      <li v-for="g in ordered" :key="g.game.id">
        <label class="row-item" :class="{ 'row-item--on': selected.has(g.game.id) }">
          <input type="checkbox" :checked="selected.has(g.game.id)" @change="toggle(g.game.id)" />
          <GameCover :src="g.game.coverUrl" :title="g.game.title" radius="4px" class="row-item__cover" />
          <span class="row-item__text">
            <span class="row-item__title">{{ g.game.title }}</span>
            <span class="hint">
              {{ g.voters.length ? plural(g.voters.length, 'vote') : 'aucun vote' }} · {{ g.game.playedCount ? `joué ${g.game.playedCount} fois` : 'jamais joué' }}
            </span>
          </span>
        </label>
      </li>
    </ul>

    <p v-if="error" class="error">{{ error }}</p>

    <div class="row">
      <button type="button" class="btn" style="flex: 1" @click="emit('close')">Annuler</button>
      <button type="button" class="btn btn--primary" style="flex: 2" :disabled="pending" @click="emit('save', [...selected])">
        <IconCheck :size="16" />
        Enregistrer ({{ selected.size }})
      </button>
    </div>
  </BottomSheet>
</template>

<style scoped>
.list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
  max-height: 50dvh;
  overflow-y: auto;
}

.row-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: var(--surface);
  cursor: pointer;
}

.row-item--on {
  border-color: var(--accent);
  background: var(--accent-soft);
}

.row-item input {
  width: 18px;
  height: 18px;
  accent-color: var(--accent);
  margin: 0;
}

.row-item__cover {
  width: 44px;
  flex-shrink: 0;
}

.row-item__text {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.row-item__title {
  font-size: 14px;
  font-weight: 500;
}
</style>
