<script setup lang="ts">
import { IconCalendarEvent, IconCheck, IconX } from '@tabler/icons-vue'

const props = withDefaults(
  defineProps<{
    date: string
    pending?: boolean
    label?: string
    hideDate?: boolean
  }>(),
  { pending: false, label: 'Changer', hideDate: false },
)
const emit = defineEmits<{ save: [date: string] }>()

const editing = ref(false)
const draft = ref(props.date)
const error = ref('')

watch(
  () => props.date,
  d => {
    draft.value = d
    editing.value = false
  },
)

function start() {
  draft.value = props.date
  error.value = ''
  editing.value = true
}

function save() {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(draft.value)) {
    error.value = 'Choisis une date'
    return
  }
  if (draft.value === props.date) {
    editing.value = false
    return
  }
  emit('save', draft.value)
}
</script>

<template>
  <div class="date-editor">
    <template v-if="!editing">
      <button type="button" class="date-editor__trigger" @click="start">
        <IconCalendarEvent :size="14" />
        <span v-if="!hideDate">{{ formatNightDate(date) }}</span>
        <span v-else>{{ label }}</span>
        <span v-if="!hideDate" class="date-editor__change">· {{ label }}</span>
      </button>
    </template>
    <form v-else class="date-editor__form" @submit.prevent="save">
      <input v-model="draft" type="date" class="input date-editor__input" :disabled="pending" />
      <button type="submit" class="btn btn--primary btn--icon" style="width: 36px; height: 36px" aria-label="Valider la date" :disabled="pending">
        <IconCheck :size="16" />
      </button>
      <button type="button" class="btn btn--icon" style="width: 36px; height: 36px" aria-label="Annuler" @click="editing = false">
        <IconX :size="16" />
      </button>
      <p v-if="error" class="error">{{ error }}</p>
    </form>
  </div>
</template>

<style scoped>
.date-editor__trigger {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 0;
  border: none;
  background: none;
  color: var(--text-3);
  font-size: 12px;
}

.date-editor__change {
  color: var(--accent);
}

.date-editor__form {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 4px;
  flex-wrap: wrap;
}

.date-editor__input {
  height: 36px;
  width: auto;
  font-size: 14px;
}
</style>
