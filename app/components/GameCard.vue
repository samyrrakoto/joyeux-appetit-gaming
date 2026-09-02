<script setup lang="ts">
import { IconCheck, IconCrown, IconDeviceGamepad2, IconThumbUp } from '@tabler/icons-vue'
import type { NightGameDto } from '#shared/types'

defineProps<{
  item: NightGameDto
  /** Position dans le classement des votes, ou null si le tri n'est pas par votes. */
  rank: number | null
  voted: boolean
  disabled?: boolean
}>()

defineEmits<{ toggle: [] }>()
</script>

<template>
  <article class="game" :class="{ 'game--voted': voted }">
    <GameCover :src="item.game.coverUrl" :title="item.game.title" radius="var(--cover-radius) var(--cover-radius) 0 0">
      <span v-if="rank === 1 && item.voters.length" class="badge badge--gold game__rank">
        <IconCrown :size="12" />
        1er
      </span>
      <span v-else-if="rank && item.voters.length" class="badge game__rank">{{ ordinal(rank) }}</span>
      <span v-if="item.playedTonight" class="badge badge--success game__played">
        <IconDeviceGamepad2 :size="12" />
        Joué ce soir
      </span>
    </GameCover>

    <div class="game__body">
      <h3 class="game__title">{{ item.game.title }}</h3>
      <p class="hint">{{ item.game.playedCount ? `Joué ${item.game.playedCount} fois` : 'Jamais joué' }}</p>

      <div class="game__voters">
        <VotersPopover :voters="item.voters" :size="28" :max="4" />
      </div>

      <button
        type="button"
        class="btn btn--sm btn--block"
        :class="voted ? 'btn--accent' : ''"
        :disabled="disabled"
        @click="$emit('toggle')"
      >
        <IconCheck v-if="voted" :size="16" />
        <IconThumbUp v-else :size="16" />
        {{ voted ? 'Voté' : 'Voter' }}
      </button>
    </div>
  </article>
</template>

<style scoped>
.game {
  --cover-radius: calc(var(--radius-lg) - 1px);
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  display: flex;
  flex-direction: column;
}

.game--voted {
  border-color: var(--accent-border-soft);
  background: var(--accent-tint);
}

.game--voted .game__title {
  color: var(--accent-text);
}

.game__rank {
  position: absolute;
  top: 8px;
  left: 8px;
  background: var(--surface);
}

.game__played {
  position: absolute;
  top: 8px;
  right: 8px;
}

.game__body {
  padding: 8px 10px 10px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
}

.game__title {
  font-size: 14px;
  line-height: 1.3;
  flex: 1;
}

.game__voters {
  display: flex;
  align-items: center;
  min-height: 28px;
  margin: 2px 0 6px;
}
</style>
