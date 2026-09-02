<script setup lang="ts">
import { IconDice5 } from '@tabler/icons-vue'

const model = defineModel<string>({ required: true })

const current = computed(() => parseAvatar(model.value))
const icons = Object.keys(AVATAR_ICONS)
const colors = Object.keys(AVATAR_COLORS)

const setIcon = (icon: string) => (model.value = formatAvatar(icon, current.value.color))
const setColor = (color: string) => (model.value = formatAvatar(current.value.icon, color))
const shuffle = () => (model.value = randomAvatar())
</script>

<template>
  <div class="picker">
    <div class="picker__preview">
      <AppAvatar :avatar="model" :size="64" />
      <button type="button" class="btn btn--sm" @click="shuffle">
        <IconDice5 :size="16" />
        Au hasard
      </button>
    </div>

    <div class="picker__icons">
      <button
        v-for="icon in icons"
        :key="icon"
        type="button"
        class="picker__icon"
        :class="{ 'picker__icon--active': icon === current.icon }"
        :aria-label="icon"
        @click="setIcon(icon)"
      >
        <AppAvatar :avatar="formatAvatar(icon, current.color)" :size="40" />
      </button>
    </div>

    <div class="picker__colors">
      <button
        v-for="color in colors"
        :key="color"
        type="button"
        class="picker__color"
        :class="{ 'picker__color--active': color === current.color }"
        :style="{ background: AVATAR_COLORS[color]!.solid }"
        :aria-label="color"
        @click="setColor(color)"
      />
    </div>
  </div>
</template>

<style scoped>
.picker {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.picker__preview {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.picker__icons {
  display: grid;
  grid-template-columns: repeat(8, 1fr);
  gap: 6px;
}

.picker__icon {
  padding: 0;
  border: 2px solid transparent;
  border-radius: 50%;
  background: none;
  display: flex;
}

.picker__icon--active {
  border-color: var(--accent);
}

.picker__colors {
  display: flex;
  gap: 8px;
  justify-content: space-between;
}

.picker__color {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: 3px solid transparent;
  padding: 0;
}

.picker__color--active {
  border-color: var(--text);
}
</style>
