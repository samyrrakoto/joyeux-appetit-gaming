<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    avatar: string | null | undefined
    size?: number
    selected?: boolean
  }>(),
  { size: 40, selected: false },
)

const parsed = computed(() => parseAvatar(props.avatar))
const palette = computed(() => AVATAR_COLORS[parsed.value.color]!)
const iconComponent = computed(() => AVATAR_ICONS[parsed.value.icon]!)
</script>

<template>
  <span
    class="avatar"
    :class="{ 'avatar--selected': selected }"
    :style="{
      width: `${size}px`,
      height: `${size}px`,
      background: palette.bg,
      color: palette.fg,
    }"
  >
    <component :is="iconComponent" :size="Math.round(size * 0.55)" :stroke-width="1.75" />
  </span>
</template>

<style scoped>
.avatar {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  flex-shrink: 0;
  border: 2px solid transparent;
}

.avatar--selected {
  border-color: var(--accent);
}
</style>
