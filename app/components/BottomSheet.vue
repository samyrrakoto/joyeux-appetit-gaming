<script setup lang="ts">
import { IconX } from '@tabler/icons-vue'

defineProps<{ open: boolean; title: string }>()
const emit = defineEmits<{ close: [] }>()
</script>

<template>
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="open" class="sheet__backdrop" @click.self="emit('close')">
        <section class="sheet" role="dialog" :aria-label="title">
          <div class="sheet__handle" />
          <header class="sheet__header">
            <h2>{{ title }}</h2>
            <button type="button" class="btn btn--ghost btn--icon" aria-label="Fermer" @click="emit('close')">
              <IconX :size="20" />
            </button>
          </header>
          <div class="sheet__content">
            <slot />
          </div>
        </section>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.sheet__backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: flex-end;
  justify-content: center;
  z-index: 50;
}

.sheet {
  width: 100%;
  max-width: 520px;
  max-height: 90dvh;
  overflow-y: auto;
  background: var(--surface);
  border-radius: 20px 20px 0 0;
  padding: 10px 16px calc(20px + env(safe-area-inset-bottom));
}

.sheet__handle {
  width: 36px;
  height: 4px;
  border-radius: 2px;
  background: var(--border-strong);
  margin: 0 auto 12px;
}

.sheet__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.sheet__header h2 {
  font-size: 17px;
}

.sheet__content {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
</style>
