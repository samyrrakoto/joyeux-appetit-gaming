<script setup lang="ts">
import type { PlayerDto } from '#shared/types'

const props = withDefaults(
  defineProps<{
    voters: PlayerDto[]
    size?: number
    max?: number
    align?: 'left' | 'right'
  }>(),
  { size: 28, max: 5, align: 'left' },
)

const pinned = ref(false)
const root = ref<HTMLElement | null>(null)
const id = useId()

const shown = computed(() => props.voters.slice(0, props.max))
const extra = computed(() => Math.max(0, props.voters.length - props.max))

function toggle() {
  pinned.value = !pinned.value
}

function onDocumentClick(e: MouseEvent) {
  if (pinned.value && root.value && !root.value.contains(e.target as Node)) pinned.value = false
}

function onKey(e: KeyboardEvent) {
  if (e.key === 'Escape') pinned.value = false
}

onMounted(() => {
  document.addEventListener('click', onDocumentClick)
  document.addEventListener('keydown', onKey)
})
onUnmounted(() => {
  document.removeEventListener('click', onDocumentClick)
  document.removeEventListener('keydown', onKey)
})

watch(
  () => props.voters.length,
  n => {
    if (!n) pinned.value = false
  },
)
</script>

<template>
  <div ref="root" class="voters" :class="{ 'voters--pinned': pinned, 'voters--right': align === 'right' }">
    <button
      v-if="voters.length"
      type="button"
      class="voters__trigger"
      :aria-expanded="pinned"
      :aria-controls="id"
      aria-label="Voir qui a voté"
      @click.stop="toggle"
    >
      <span class="voters__stack" :style="{ '--size': `${size}px` }">
        <AppAvatar v-for="v in shown" :key="v.id" :avatar="v.avatar" :size="size" />
        <span v-if="extra" class="voters__more" :style="{ width: `${size}px`, height: `${size}px` }">+{{ extra }}</span>
      </span>
      <span class="voters__count">{{ plural(voters.length, 'vote') }}</span>
    </button>
    <span v-else class="hint">Aucun vote pour l'instant</span>

    <div v-if="voters.length" :id="id" class="voters__popover" role="tooltip">
      <p class="voters__title">{{ voters.length === 1 ? 'A voté' : 'Ont voté' }}</p>
      <ul class="voters__list">
        <li v-for="v in voters" :key="v.id" class="voters__item">
          <AppAvatar :avatar="v.avatar" :size="22" />
          <span>{{ v.name }}</span>
        </li>
      </ul>
    </div>
  </div>
</template>

<style scoped>
.voters {
  position: relative;
  display: inline-flex;
  align-items: center;
  min-height: 28px;
}

.voters__trigger {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 2px 6px 2px 2px;
  margin-left: -2px;
  border: none;
  border-radius: 999px;
  background: transparent;
  color: var(--text-2);
  font: inherit;
  font-size: 12px;
  cursor: pointer;
}

.voters__trigger:hover,
.voters--pinned .voters__trigger {
  background: var(--surface-2);
}

.voters__stack {
  display: inline-flex;
}

.voters__stack > * {
  outline: 2px solid var(--surface);
  border-radius: 50%;
}

.voters__stack > * + * {
  margin-left: calc(var(--size) * -0.3);
}

.voters__more {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: var(--surface-2);
  color: var(--text-2);
  font-size: 11px;
  font-weight: 600;
}

.voters__count {
  white-space: nowrap;
}

.voters__popover {
  position: absolute;
  left: 0;
  bottom: calc(100% + 6px);
  z-index: 20;
  min-width: 160px;
  max-width: 240px;
  padding: 8px 10px;
  background: var(--surface);
  border: 1px solid var(--border-strong);
  border-radius: var(--radius);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.12);
  opacity: 0;
  visibility: hidden;
  transform: translateY(4px);
  transition: opacity 0.12s ease, transform 0.12s ease, visibility 0.12s;
}

.voters--right .voters__popover {
  left: auto;
  right: 0;
}

@media (hover: hover) {
  .voters:hover .voters__popover,
  .voters:focus-within .voters__popover {
    opacity: 1;
    visibility: visible;
    transform: translateY(0);
  }
}

.voters--pinned .voters__popover {
  opacity: 1;
  visibility: visible;
  transform: translateY(0);
}

.voters__title {
  font-size: 11px;
  font-weight: 600;
  color: var(--text-3);
  text-transform: uppercase;
  letter-spacing: 0.03em;
  margin-bottom: 6px;
}

.voters__list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.voters__item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: var(--text);
  white-space: nowrap;
}
</style>
