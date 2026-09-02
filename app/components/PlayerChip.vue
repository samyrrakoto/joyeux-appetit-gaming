<script setup lang="ts">
import type { PlayerDto } from '#shared/types'

defineProps<{ player: PlayerDto; active?: boolean }>()
</script>

<template>
  <button type="button" class="chip" :class="{ 'chip--active': active }">
    <AppAvatar :avatar="player.avatar" :size="24" />
    <span>{{ player.name }}</span>
  </button>
</template>

<style scoped>
.chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 12px 4px 4px;
  border: 1px solid var(--border-strong);
  border-radius: 999px;
  background: var(--surface);
  color: var(--text);
  font-size: 13px;
  font-weight: 500;
}

.chip--active {
  border-color: var(--accent);
  background: var(--accent-soft);
  color: var(--accent-text);
}
</style>
