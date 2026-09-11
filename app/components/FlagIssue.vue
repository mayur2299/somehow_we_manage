<script setup lang="ts">
const props = defineProps<{ wardSlug: string; serviceKey: string; serviceLabel: string }>()
const emit = defineEmits<{ (e: 'flagged'): void }>()

const note = ref('')
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
  if (!note.value.trim() && !photo.value) { error.value = 'Add a short note or a photo.'; return }
  busy.value = true
  try {
    await $fetch('/api/flags', { method: 'POST', body: { ward: props.wardSlug, service: props.serviceKey, note: note.value, photo: photo.value } })
    done.value = true; note.value = ''; photo.value = undefined
    emit('flagged')
    setTimeout(() => (done.value = false), 2500)
  } catch (e: any) {
    error.value = e?.data?.statusMessage || 'Could not save. Try again.'
  } finally { busy.value = false }
}
</script>

<template>
  <div class="flag">
    <p class="lead">Budgeted for {{ serviceLabel.toLowerCase() }}, but you don't see it on the ground? Say where.</p>
    <textarea v-model="note" rows="2" maxlength="280" placeholder="e.g. Drain outside Marol Naka bus stop has been open since June"></textarea>
    <div class="row">
      <label class="file">
        <input type="file" accept="image/*" capture="environment" @change="onFile" />
        {{ photo ? 'Photo added' : 'Add photo' }}
      </label>
      <button class="primary" :disabled="busy" @click="submit">{{ busy ? 'Saving…' : done ? 'Flagged, thank you' : 'Flag it' }}</button>
    </div>
    <img v-if="photo" :src="photo" class="preview" alt="" />
    <p v-if="error" class="err">{{ error }}</p>
  </div>
</template>

<style scoped>
.flag { margin-top: 0.9rem; background: #f0f4ff; border: 1px solid #c9d6ff; border-radius: 12px; padding: 0.9rem; }
.lead { margin: 0 0 0.6rem; font-weight: 600; }
textarea { width: 100%; box-sizing: border-box; border: 1px solid #ddd; border-radius: 8px; padding: 0.5rem 0.6rem; font: inherit; font-size: 0.9rem; background: #fff; resize: vertical; }
.row { display: flex; gap: 0.5rem; margin-top: 0.5rem; align-items: center; }
.file { border: 1px solid #ccc; background: #fff; border-radius: 8px; padding: 0.5rem 0.9rem; cursor: pointer; font-size: 0.9rem; }
.file input { display: none; }
button { border: 1px solid #111; background: #111; color: #fff; border-radius: 8px; padding: 0.5rem 0.9rem; cursor: pointer; font: inherit; }
button:disabled { opacity: 0.6; }
.preview { display: block; max-height: 140px; border-radius: 8px; margin-top: 0.5rem; }
.err { color: #c92a2a; font-size: 0.85rem; margin: 0.5rem 0 0; }
</style>
