<script setup lang="ts">
import { FLAG_TAGS } from '~/utils/tags'
const props = defineProps<{
  wardSlug: string
  serviceKey: string
  services: { key: string; label: string; icon: string }[]
}>()
const emit = defineEmits<{ (e: 'flagged'): void }>()

const service = ref(props.serviceKey)
watch(() => props.serviceKey, v => (service.value = v))
const tag = ref('')
const pickSvc = ref(false)
const note = ref('')
const title = ref('')
const locality = ref('')
const photo = ref<string | undefined>()
const busy = ref(false)
const done = ref(false)
const error = ref('')

async function onFile(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  const img = new Image()
  img.src = URL.createObjectURL(file)
  await new Promise(r => (img.onload = r))
  const max = 900
  const scale = Math.min(1, max / Math.max(img.width, img.height))
  const c = document.createElement('canvas')
  c.width = Math.round(img.width * scale); c.height = Math.round(img.height * scale)
  c.getContext('2d')!.drawImage(img, 0, 0, c.width, c.height)
  photo.value = c.toDataURL('image/jpeg', 0.7)
  URL.revokeObjectURL(img.src)
}

async function submit() {
  error.value = ''
  if (!tag.value) { error.value = 'Pick what is wrong first.'; return }
  if (!note.value.trim() && !photo.value) { error.value = 'Add a line or a photo.'; return }
  busy.value = true
  try {
    await $fetch('/api/flags', { method: 'POST', body: { ward: props.wardSlug, service: service.value, note: note.value, tag: tag.value, photo: photo.value, locality: locality.value, title: title.value } })
    done.value = true; note.value = ''; title.value = ''; tag.value = ''; locality.value = ''; photo.value = undefined
    emit('flagged')
    setTimeout(() => (done.value = false), 2500)
  } catch (e: any) {
    error.value = e?.data?.statusMessage || 'Could not save. Try again.'
  } finally { busy.value = false }
}
</script>

<template>
  <form class="flag" @submit.prevent="submit">
    <p class="label">About <button type="button" class="linkbtn" @click="pickSvc = !pickSvc">{{ (services ?? []).find(s => s.key === service)?.icon }} {{ (services ?? []).find(s => s.key === service)?.label }} · change</button></p>
    <div v-if="pickSvc" class="tags">
      <button v-for="s in (services ?? [])" :key="s.key" type="button" class="pill" :class="{ ink: service === s.key }" @click="service = s.key; pickSvc = false">{{ s.icon }} {{ s.label }}</button>
    </div>
    <p class="label">What is wrong</p>
    <div class="tags">
      <button v-for="t in FLAG_TAGS" :key="t.key" type="button" class="pill" :class="{ red: tag === t.key }" :title="t.hint" @click="tag = t.key">{{ t.label }}</button>
    </div>
    <input v-model="title" class="input" maxlength="90" placeholder="Headline · e.g. Drain open outside Marol Naka bus stop since June" />
    <textarea v-model="note" class="input" rows="2" maxlength="280" placeholder="What exactly do you see? When did it start?"></textarea>
    <div class="row">
      <input v-model="locality" class="input loc" maxlength="60" placeholder="Locality (optional) · Marol, Chakala…" />
      <label class="btn sm file">
        <input type="file" accept="image/*" capture="environment" @change="onFile" />
        {{ photo ? '📸 Photo added' : '📸 Add photo' }}
      </label>
      <button class="btn sm flag" type="submit" :disabled="busy">{{ busy ? 'Posting…' : done ? '🚩 Posted' : '🚩 Post it' }}</button>
    </div>
    <img v-if="photo" :src="photo" class="preview" alt="" />
    <p v-if="error" class="err">{{ error }}</p>
  </form>
</template>

<style scoped>
.flag { display: grid; gap: 10px; }
.label { margin: 4px 0 0; }
.linkbtn { border: 0; background: none; font: inherit; font-weight: 900; text-decoration: underline; cursor: pointer; padding: 0; text-transform: none; letter-spacing: 0; font-size: 14px; }
.tags { display: flex; flex-wrap: wrap; gap: 8px; }
.tags .pill { cursor: pointer; min-height: 36px; }
.row { display: flex; gap: 10px; flex-wrap: wrap; align-items: center; }
.loc { flex: 1; min-width: 180px; }
.file { cursor: pointer; }
.file input { display: none; }
.preview { display: block; max-height: 160px; border: 2px solid var(--ink); border-radius: 14px; }
.err { color: var(--coral); font-weight: 800; margin: 0; }
</style>
