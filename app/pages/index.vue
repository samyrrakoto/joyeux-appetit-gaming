<script setup lang="ts">
import { IconArrowRight, IconDeviceGamepad2, IconUserPlus } from '@tabler/icons-vue'
import type { PlayerDto } from '#shared/types'

definePageMeta({ layout: 'bare' })

const { player, setPlayer } = usePlayer()
if (player.value) await navigateTo('/tonight', { replace: true })

const { data: players, refresh } = await useFetch<PlayerDto[]>('/api/players', { default: () => [] })

const mode = ref<'pick' | 'create'>('pick')
const selected = ref<PlayerDto | null>(null)
const name = ref('')
const avatar = ref(randomAvatar())
const error = ref('')
const saving = ref(false)

watch(players, list => {
  if (!list.length) mode.value = 'create'
}, { immediate: true })

function enter(p: PlayerDto) {
  setPlayer(p)
  return navigateTo('/tonight')
}

async function create() {
  error.value = ''
  if (!name.value.trim()) {
    error.value = 'Entre un pseudo'
    return
  }
  saving.value = true
  try {
    const created = await $fetch<PlayerDto>('/api/players', {
      method: 'POST',
      body: { name: name.value.trim(), avatar: avatar.value },
    })
    await refresh()
    await enter(created)
  } catch (e: unknown) {
    const err = e as { data?: { statusMessage?: string } }
    error.value = err.data?.statusMessage ?? 'Impossible de créer le profil'
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="welcome">
    <header class="row" style="margin-bottom: 24px">
      <span class="welcome__logo"><IconDeviceGamepad2 :size="24" /></span>
      <div>
        <h1>Joyeux Appétit Gaming</h1>
        <p class="muted small">{{ mode === 'pick' ? 'Qui es-tu ?' : 'Crée ton profil' }}</p>
      </div>
    </header>

    <template v-if="mode === 'pick'">
      <div class="profiles">
        <button
          v-for="p in players"
          :key="p.id"
          type="button"
          class="profile"
          :class="{ 'profile--active': selected?.id === p.id }"
          @click="selected = p"
        >
          <AppAvatar :avatar="p.avatar" :size="44" />
          <span class="profile__name">{{ p.name }}</span>
          <span class="hint">{{ p.nightsCount ? plural(p.nightsCount, 'soirée') : 'nouveau' }}</span>
        </button>

        <button type="button" class="profile profile--new" @click="mode = 'create'">
          <span class="profile__plus"><IconUserPlus :size="20" /></span>
          <span class="profile__name">Nouveau</span>
          <span class="hint">créer un profil</span>
        </button>
      </div>

      <button type="button" class="btn btn--primary btn--block" :disabled="!selected" @click="selected && enter(selected)">
        {{ selected ? `Continuer en tant que ${selected.name}` : 'Choisis ton profil' }}
        <IconArrowRight :size="18" />
      </button>
      <p class="hint" style="text-align: center; margin-top: 12px">Ton choix est mémorisé sur cet appareil.</p>
    </template>

    <form v-else class="stack" style="gap: 20px" @submit.prevent="create">
      <div>
        <label class="label" for="name">Ton prénom ou pseudo</label>
        <input id="name" v-model="name" class="input" type="text" maxlength="24" autocomplete="nickname" autofocus />
        <p v-if="error" class="error" style="margin-top: 6px">{{ error }}</p>
      </div>

      <div>
        <span class="label">Avatar <span class="hint">(optionnel, un est déjà tiré pour toi)</span></span>
        <AvatarPicker v-model="avatar" />
      </div>

      <button type="submit" class="btn btn--primary btn--block" :disabled="saving">
        Entrer dans la salle
        <IconArrowRight :size="18" />
      </button>
      <button v-if="players.length" type="button" class="btn btn--ghost btn--block" @click="mode = 'pick'">
        J'ai déjà un profil
      </button>
      <p class="hint" style="text-align: center">Pas de compte, pas de mot de passe.</p>
    </form>
  </div>
</template>

<style scoped>
.welcome {
  padding-top: 24px;
}

.welcome__logo {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: var(--accent-soft);
  color: var(--accent-text);
}

.profiles {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
  margin-bottom: 20px;
}

.profile {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 14px 6px 10px;
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  background: var(--surface);
  color: var(--text);
}

.profile--active {
  border: 2px solid var(--accent);
}

.profile--new {
  border-style: dashed;
  border-color: var(--border-strong);
  background: transparent;
}

.profile__plus {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: var(--surface-2);
  color: var(--text-2);
}

.profile__name {
  font-size: 13px;
  font-weight: 600;
}
</style>
