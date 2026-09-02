<script setup lang="ts">
import { IconConfetti, IconHistory, IconUser } from '@tabler/icons-vue'

const tabs = [
  { to: '/tonight', label: 'Ce soir', icon: IconConfetti },
  { to: '/history', label: 'Historique', icon: IconHistory },
  { to: '/profile', label: 'Profil', icon: IconUser },
]

const route = useRoute()
const isActive = (to: string) => route.path === to || route.path.startsWith(`${to}/`)
</script>

<template>
  <nav class="tabbar">
    <NuxtLink
      v-for="tab in tabs"
      :key="tab.to"
      :to="tab.to"
      class="tabbar__item"
      :class="{ 'tabbar__item--active': isActive(tab.to) }"
    >
      <component :is="tab.icon" :size="22" :stroke-width="1.75" />
      <span>{{ tab.label }}</span>
    </NuxtLink>
  </nav>
</template>

<style scoped>
.tabbar {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  justify-content: space-around;
  padding: 8px 8px calc(8px + env(safe-area-inset-bottom));
  background: var(--surface);
  border-top: 1px solid var(--border);
}

.tabbar__item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  min-width: 80px;
  font-size: 11px;
  color: var(--text-3);
}

.tabbar__item--active {
  color: var(--accent);
  font-weight: 600;
}
</style>
