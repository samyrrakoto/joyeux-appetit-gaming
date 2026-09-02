<script setup lang="ts">
import { IconLink } from '@tabler/icons-vue'

const model = defineModel<string>({ required: true })

withDefaults(defineProps<{ label?: string; hint?: string }>(), {
  label: 'Lien vers une jaquette',
  hint: 'Colle l’adresse d’une image (clic droit sur une image, « Copier l’adresse de l’image »).',
})

const isValid = computed(() => /^https?:\/\/\S+$/i.test(model.value.trim()))
const showError = computed(() => model.value.trim().length > 0 && !isValid.value)
</script>

<template>
  <div>
    <label class="label" for="cover-url">{{ label }} <span class="hint" style="font-weight: 400">(optionnel)</span></label>
    <div class="field">
      <input
        id="cover-url"
        v-model="model"
        class="input"
        type="url"
        inputmode="url"
        placeholder="https://…/jaquette.jpg"
        autocomplete="off"
        spellcheck="false"
      />
      <IconLink class="field__icon" :size="16" />
    </div>
    <p v-if="showError" class="error" style="margin-top: 6px">Le lien doit commencer par http:// ou https://</p>
    <p v-else class="hint" style="margin-top: 6px">{{ hint }}</p>
  </div>
</template>

<style scoped>
.field {
  position: relative;
}

.field .input {
  padding-right: 36px;
  font-size: 14px;
}

.field__icon {
  position: absolute;
  right: 12px;
  top: 14px;
  color: var(--text-3);
}
</style>
