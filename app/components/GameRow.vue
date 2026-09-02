<script setup lang="ts">
import { IconCheck, IconCrown, IconDeviceGamepad2, IconThumbUp } from '@tabler/icons-vue'
import type { NightGameDto } from '#shared/types'

defineProps<{
  item: NightGameDto
  /** Rang dans le classement des votes, ou null si le tri n'est pas par votes. */
  rank: number | null
  /** Réserve la colonne du rang même sans vote, pour garder les jaquettes alignées. */
  showRank: boolean
  voted: boolean
  disabled?: boolean
}>()

defineEmits<{ toggle: [] }>()
</script>

<template>
  <li class="grow" :class="{ 'grow--voted': voted }">
    <span v-if="showRank" class="grow__rank">
      <span v-if="rank === 1 && item.voters.length" class="grow__badge grow__badge--gold" aria-label="Premier">
        <IconCrown :size="12" />
      </span>
      <span v-else-if="rank && item.voters.length" class="grow__badge">{{ ordinal(rank) }}</span>
    </span>

    <span class="grow__cover">
      <GameCover :src="item.game.coverUrl" :title="item.game.title" radius="5px" />
      <span v-if="item.playedTonight" class="grow__played" aria-label="Joué ce soir" title="Joué ce soir">
        <IconDeviceGamepad2 :size="10" />
      </span>
    </span>

    <span class="grow__text">
      <span class="grow__title">{{ item.game.title }}</span>
      <span class="grow__meta">
        <VotersPopover v-if="item.voters.length" :voters="item.voters" :size="16" :max="4" />
        <span v-else class="hint">Aucun vote</span>
        <span class="hint"> · {{ item.game.playedCount ? `joué ${item.game.playedCount} fois` : 'jamais joué' }}</span>
      </span>
    </span>

    <button
      type="button"
      class="btn btn--sm grow__vote"
      :class="voted ? 'btn--accent' : ''"
      :disabled="disabled"
      @click="$emit('toggle')"
    >
      <IconCheck v-if="voted" :size="14" />
      <IconThumbUp v-else :size="14" />
      {{ voted ? 'Voté' : 'Voter' }}
    </button>
  </li>
</template>

<style scoped>
.grow {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 7px 8px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
}

.grow--voted {
  border: 2px solid var(--accent);
  padding: 6px 7px;
}

.grow__rank {
  width: 22px;
  flex-shrink: 0;
  display: flex;
  justify-content: center;
}

.grow__badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: var(--surface-2);
  color: var(--text-2);
  font-size: 10px;
  font-weight: 600;
}

.grow__badge--gold {
  background: var(--warning-soft);
  color: var(--warning-text);
}

.grow__cover {
  position: relative;
  width: 44px;
  flex-shrink: 0;
}

.grow__played {
  position: absolute;
  right: -4px;
  bottom: -4px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: var(--success-soft);
  color: var(--success-text);
  outline: 1.5px solid var(--surface);
}

.grow__text {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.grow__title {
  font-size: 13px;
  font-weight: 600;
  line-height: 1.25;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.grow__meta {
  display: flex;
  align-items: center;
  font-size: 11px;
  white-space: nowrap;
  overflow: hidden;
}

.grow__meta :deep(.voters__trigger) {
  font-size: 11px;
  gap: 5px;
  padding: 0 4px 0 0;
  margin: 0;
}

.grow__meta :deep(.voters) {
  min-height: 0;
}

.grow__vote {
  height: 30px;
  padding: 0 10px;
  font-size: 12px;
  gap: 4px;
  flex-shrink: 0;
}
</style>
