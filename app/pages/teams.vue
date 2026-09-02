<script setup lang="ts">
import { IconArrowLeft, IconArrowsShuffle, IconCheck, IconPencil, IconPlus, IconTrash, IconX } from '@tabler/icons-vue'
import type { PlayerDto } from '#shared/types'

interface DraftTeam {
  id?: string
  name: string
  color: string
  memberIds: string[]
}

const { night, pending, error, refresh, saveTeams } = useNight()
await refresh()
const { data: allPlayers } = await useFetch<PlayerDto[]>('/api/players', { default: () => [] })

const teams = ref<DraftTeam[]>(
  night.value?.teams.length
    ? night.value.teams.map(t => ({ id: t.id, name: t.name, color: t.color, memberIds: t.members.map(m => m.id) }))
    : [
        { name: TEAM_NAMES.coral!, color: 'coral', memberIds: [] },
        { name: TEAM_NAMES.blue!, color: 'blue', memberIds: [] },
      ],
)

const selectedPlayer = ref<string | null>(null)
const editingName = ref<number | null>(null)

const playersById = computed(() => new Map(allPlayers.value.map(p => [p.id, p])))
const assigned = computed(() => new Set(teams.value.flatMap(t => t.memberIds)))
const bench = computed(() => {
  const nightIds = new Set((night.value?.players ?? []).map(p => p.id))
  return allPlayers.value
    .filter(p => !assigned.value.has(p.id))
    .sort((a, b) => Number(nightIds.has(b.id)) - Number(nightIds.has(a.id)) || a.name.localeCompare(b.name))
})

function addTeam() {
  const used = new Set(teams.value.map(t => t.color))
  const color = TEAM_COLORS.find(c => !used.has(c)) ?? 'gray'
  teams.value.push({ name: TEAM_NAMES[color] ?? `Équipe ${teams.value.length + 1}`, color, memberIds: [] })
}

function removeTeam(index: number) {
  teams.value.splice(index, 1)
}

function place(team: DraftTeam) {
  if (!selectedPlayer.value) return
  teams.value.forEach(t => (t.memberIds = t.memberIds.filter(id => id !== selectedPlayer.value)))
  team.memberIds.push(selectedPlayer.value)
  selectedPlayer.value = null
}

function unassign(team: DraftTeam, playerId: string) {
  team.memberIds = team.memberIds.filter(id => id !== playerId)
}

function shuffle() {
  if (!teams.value.length) return
  const pool = [...assigned.value, ...bench.value.filter(p => (night.value?.players ?? []).some(n => n.id === p.id)).map(p => p.id)]
  const unique = [...new Set(pool)]
  for (let i = unique.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[unique[i], unique[j]] = [unique[j]!, unique[i]!]
  }
  teams.value.forEach(t => (t.memberIds = []))
  unique.forEach((id, i) => teams.value[i % teams.value.length]!.memberIds.push(id))
}

async function save() {
  await saveTeams(teams.value.filter(t => t.name.trim()))
  await navigateTo('/tonight')
}
</script>

<template>
  <div>
    <header class="page-header">
      <NuxtLink to="/tonight" class="btn btn--ghost btn--icon" aria-label="Retour"><IconArrowLeft :size="20" /></NuxtLink>
      <div style="flex: 1">
        <h1>Équipes du soir</h1>
        <p class="hint">{{ night ? formatNightDate(night.nightDate) : '' }}</p>
      </div>
      <button type="button" class="btn btn--sm" @click="shuffle">
        <IconArrowsShuffle :size="15" />
        Aléatoire
      </button>
    </header>

    <p v-if="selectedPlayer" class="banner">
      <AppAvatar :avatar="playersById.get(selectedPlayer)?.avatar" :size="22" />
      {{ playersById.get(selectedPlayer)?.name }} : touche une équipe pour le placer.
      <button type="button" class="btn btn--ghost btn--icon" style="width: 28px; height: 28px" @click="selectedPlayer = null">
        <IconX :size="14" />
      </button>
    </p>

    <div class="teams">
      <section
        v-for="(team, i) in teams"
        :key="team.id ?? i"
        class="team"
        :class="{ 'team--target': selectedPlayer }"
        :style="{ borderTopColor: teamColor(team.color).solid }"
        @click="place(team)"
      >
        <header class="team__head" @click.stop>
          <input
            v-if="editingName === i"
            v-model="team.name"
            class="input team__name-input"
            maxlength="30"
            autofocus
            @blur="editingName = null"
            @keydown.enter="editingName = null"
          />
          <h3 v-else class="team__name">{{ team.name }}</h3>
          <button type="button" class="btn btn--ghost btn--icon" style="width: 28px; height: 28px" aria-label="Renommer" @click="editingName = i">
            <IconPencil :size="14" />
          </button>
          <button
            v-if="teams.length > 1 && !team.memberIds.length"
            type="button"
            class="btn btn--ghost btn--icon"
            style="width: 28px; height: 28px"
            aria-label="Supprimer l'équipe"
            @click="removeTeam(i)"
          >
            <IconTrash :size="14" />
          </button>
        </header>

        <ul class="team__members">
          <li v-for="id in team.memberIds" :key="id" class="member" @click.stop="unassign(team, id)">
            <AppAvatar :avatar="playersById.get(id)?.avatar" :size="24" />
            <span>{{ playersById.get(id)?.name ?? '?' }}</span>
            <IconX :size="14" class="member__remove" />
          </li>
          <li v-if="selectedPlayer" class="member member--drop">Placer ici</li>
          <li v-else-if="!team.memberIds.length" class="member member--drop">Aucun joueur</li>
        </ul>
      </section>
    </div>

    <button type="button" class="btn btn--dashed btn--block btn--sm" style="margin: 10px 0 16px" @click="addTeam">
      <IconPlus :size="15" />
      Ajouter une équipe
    </button>

    <section class="card" style="padding: 12px; margin-bottom: 16px">
      <p class="label">Pas encore placés</p>
      <div v-if="bench.length" class="bench">
        <PlayerChip
          v-for="p in bench"
          :key="p.id"
          :player="p"
          :active="selectedPlayer === p.id"
          @click="selectedPlayer = selectedPlayer === p.id ? null : p.id"
        />
      </div>
      <p v-else class="hint">Tout le monde est placé.</p>
    </section>

    <p v-if="error" class="error" style="margin-bottom: 12px">{{ error }}</p>

    <button type="button" class="btn btn--primary btn--block" :disabled="pending" @click="save">
      <IconCheck :size="18" />
      Valider les équipes
    </button>
  </div>
</template>

<style scoped>
.banner {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  margin-bottom: 12px;
  border-radius: var(--radius);
  background: var(--accent-soft);
  color: var(--accent-text);
  font-size: 13px;
}

.teams {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.team {
  background: var(--surface);
  border: 1px solid var(--border);
  border-top: 3px solid;
  border-radius: 0 0 var(--radius-lg) var(--radius-lg);
  padding: 10px;
}

.team--target {
  cursor: pointer;
  outline: 2px dashed var(--accent);
  outline-offset: 2px;
}

.team__head {
  display: flex;
  align-items: center;
  gap: 2px;
  margin-bottom: 8px;
}

.team__name {
  flex: 1;
  font-size: 14px;
}

.team__name-input {
  flex: 1;
  height: 32px;
  font-size: 14px;
  padding: 0 8px;
}

.team__members {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.member {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  border-radius: var(--radius);
  background: var(--surface-2);
  font-size: 13px;
  cursor: pointer;
}

.member span {
  flex: 1;
}

.member__remove {
  color: var(--text-3);
}

.member--drop {
  justify-content: center;
  border: 1px dashed var(--border-strong);
  background: transparent;
  color: var(--text-3);
  font-size: 12px;
  cursor: default;
}

.bench {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
</style>
