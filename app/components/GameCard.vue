<script setup lang="ts">
import { IconCheck, IconCrown, IconThumbUp } from '@tabler/icons-vue'
import type { NightGameDto } from '#shared/types'

defineProps<{
  item: NightGameDto
  rank: number
  voted: boolean
  disabled?: boolean
}>()

defineEmits<{ toggle: [] }>()
</script>

<template>
  <article class="game" :class="{ 'game--voted': voted }">
    <GameCover :src="item.game.coverUrl" :title="item.game.title">
      <span v-if="rank === 1 && item.voters.length" class="badge badge--gold game__rank">
        <IconCrown :size="12" />
        1er
      </span>
      <span v-else-if="item.voters.length" class="badge game__rank">{{ ordinal(rank) }}</span>
    </GameCover>

    <div class="game__body">
      <h3 class="game__title">{{ item.game.title }}</h3>

      <div class="game__voters">
        <template v-if="item.voters.length">
          <div class="avatar-stack">
            <AppAvatar v-for="v in item.voters.slice(0, 5)" :key="v.id" :avatar="v.avatar" :size="20" />
          </div>
          <span class="hint">{{ plural(item.voters.length, 'vote') }}</span>
        </template>
        <span v-else class="hint">Aucun vote pour l'instant</span>
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
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.game--voted {
  border: 2px solid var(--accent);
}

.game__rank {
  position: absolute;
  top: 8px;
  left: 8px;
  background: var(--surface);
}

.game__body {
  padding: 8px 10px 10px;
  display: flex;
  flex-direction: column;
  gap: 6px;
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
  gap: 6px;
  min-height: 20px;
}
</style>
