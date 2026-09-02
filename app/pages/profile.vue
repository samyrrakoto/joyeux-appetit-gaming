<script setup lang="ts">
import { IconCheck, IconEdit, IconLogout, IconUsersGroup } from '@tabler/icons-vue'
import type { PlayerDto, PlayerStatsDto } from '#shared/types'

const { player, setPlayer } = usePlayer()
const { data: stats, refresh } = await useFetch<PlayerStatsDto>(() => `/api/players/${player.value?.id}/stats`)

const editing = ref(false)
const name = ref(player.value?.name ?? '')
const avatar = ref(player.value?.avatar ?? 'ghost:purple')
const error = ref('')
const saving = ref(false)

async function save() {
  error.value = ''
  if (!name.value.trim()) {
    error.value = 'Entre un pseudo'
    return
  }
  saving.value = true
  try {
    const updated = await $fetch<PlayerDto>(`/api/players/${player.value!.id}`, {
      method: 'PATCH',
      body: { name: name.value.trim(), avatar: avatar.value },
    })
    setPlayer(updated)
    editing.value = false
    await refresh()
  } catch (e: unknown) {
    const err = e as { data?: { statusMessage?: string } }
    error.value = err.data?.statusMessage ?? 'Impossible de sauvegarder'
  } finally {
    saving.value = false
  }
}

async function switchPlayer() {
  setPlayer(null)
  await navigateTo('/')
}

const barWidth = (played: number, wins: number) => `${played ? Math.round((wins / played) * 100) : 0}%`
</script>

<template>
  <div v-if="player">
    <header class="row" style="margin-bottom: 16px">
      <AppAvatar :avatar="player.avatar" :size="56" />
      <div style="flex: 1">
        <h1>{{ player.name }}</h1>
        <p class="hint">
          <template v-if="stats?.firstNight">Depuis {{ formatMonthYear(stats.firstNight) }} · </template>
          {{ plural(stats?.nightsCount ?? 0, 'soirée') }}
        </p>
      </div>
      <button type="button" class="btn btn--ghost btn--icon" aria-label="Modifier le profil" @click="editing = !editing">
        <IconEdit :size="20" />
      </button>
    </header>

    <form v-if="editing" class="card stack" style="padding: 14px; gap: 14px; margin-bottom: 16px" @submit.prevent="save">
      <div>
        <label class="label" for="name">Pseudo</label>
        <input id="name" v-model="name" class="input" maxlength="24" />
      </div>
      <AvatarPicker v-model="avatar" />
      <p v-if="error" class="error">{{ error }}</p>
      <div class="row">
        <button type="button" class="btn" style="flex: 1" @click="editing = false">Annuler</button>
        <button type="submit" class="btn btn--primary" style="flex: 1" :disabled="saving">
          <IconCheck :size="16" />
          Enregistrer
        </button>
      </div>
    </form>

    <div class="tiles" style="margin-bottom: 18px">
      <div class="tile"><p class="tile__label">Parties</p><p class="tile__value">{{ stats?.matchesCount ?? 0 }}</p></div>
      <div class="tile"><p class="tile__label">Victoires</p><p class="tile__value">{{ stats?.winsCount ?? 0 }}</p></div>
      <div class="tile"><p class="tile__label">Taux</p><p class="tile__value">{{ stats?.winRate ?? 0 }}%</p></div>
    </div>

    <section v-if="stats?.topGames.length" style="margin-bottom: 18px">
      <p class="label">Tes meilleurs jeux</p>
      <ul class="top">
        <li v-for="g in stats.topGames" :key="g.game.id" class="top__row">
          <GameCover :src="g.game.coverUrl" :title="g.game.title" radius="4px" class="top__cover" />
          <div style="flex: 1; min-width: 0">
            <div class="row" style="justify-content: space-between; font-size: 13px; margin-bottom: 4px">
              <span>{{ g.game.title }}</span>
              <span class="muted">{{ g.wins }} / {{ g.played }}</span>
            </div>
            <div class="bar"><div class="bar__fill" :style="{ width: barWidth(g.played, g.wins) }" /></div>
          </div>
        </li>
      </ul>
    </section>
    <div v-else class="empty card" style="margin-bottom: 18px">
      <h3>Pas encore de partie</h3>
      <p class="small">Tes stats apparaîtront après ton premier résultat enregistré.</p>
    </div>

    <div v-if="stats?.bestPartner" class="partner">
      <IconUsersGroup :size="22" />
      <div>
        <p class="small" style="font-weight: 600">Meilleur duo : avec {{ stats.bestPartner.player.name }}</p>
        <p class="small">{{ plural(stats.bestPartner.wins, 'victoire') }} sur {{ plural(stats.bestPartner.together, 'partie') }} ensemble</p>
      </div>
    </div>

    <button type="button" class="btn btn--ghost btn--block" style="margin-top: 24px" @click="switchPlayer">
      <IconLogout :size="16" />
      Changer de joueur
    </button>
  </div>
</template>

<style scoped>
.top {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.top__row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.top__cover {
  width: 48px;
  flex-shrink: 0;
}

.bar {
  height: 6px;
  border-radius: 3px;
  background: var(--surface-2);
}

.bar__fill {
  height: 100%;
  border-radius: 3px;
  background: var(--accent);
}

.partner {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  border-radius: var(--radius-lg);
  background: var(--warning-soft);
  color: var(--warning-text);
}
</style>
