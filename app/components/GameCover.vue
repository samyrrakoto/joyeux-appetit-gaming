<script setup lang="ts">
import { IconPhotoOff } from '@tabler/icons-vue'

const props = withDefaults(
  defineProps<{
    src: string | null | undefined
    title: string
    ratio?: string
    radius?: string
  }>(),
  { ratio: '4 / 3', radius: '0' },
)

const failed = ref(false)
watch(() => props.src, () => (failed.value = false))
</script>

<template>
  <div class="cover" :style="{ aspectRatio: ratio, borderRadius: radius }">
    <img v-if="src && !failed" :src="src" :alt="title" loading="lazy" @error="failed = true" />
    <div v-else class="cover__empty">
      <IconPhotoOff :size="22" :stroke-width="1.5" />
      <span>Pas de jaquette</span>
    </div>
    <slot />
  </div>
</template>

<style scoped>
.cover {
  position: relative;
  width: 100%;
  overflow: hidden;
  background: var(--surface-2);
}

.cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.cover__empty {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  color: var(--text-3);
  font-size: 11px;
}
</style>
