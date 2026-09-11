<script setup lang="ts">
const props = defineProps<{
  wardSlug: string
  wardCode: string
  services: { key: string; label: string; icon: string; avgUtil: number; be: number[]; actual: (number | null)[] }[]
  preselect?: string
  prefill?: string
}>()
const list = ref<any[]>([])
async function refresh() {
  try { const r = await $fetch<{ petitions: any[] }>(`/api/petitions?ward=${props.wardSlug}`); list.value = r.petitions } catch {}
}
onMounted(refresh)

const creating = ref(false)
const service = ref(props.preselect ?? props.services[0].key)
const title = ref('')
const demand = ref('')
const busy = ref(false)
const error = ref('')
const signed = ref<Record<string, boolean>>({})

watch(() => props.preselect, v => { if (v) { service.value = v; creating.value = true } })
watch(() => props.prefill, v => { if (v) demand.value = v })

const sum3 = (a: (number | null)[]) => a.slice(0, 3).reduce((x, y) => (x ?? 0) + (y ?? 0), 0) as number
const svcOf = (k: string) => props.services.find(s => s.key === k)
function suggest() {
  const s = svcOf(service.value)!
  const util = Math.round(s.avgUtil * 100)
  title.value = title.value || `Show us the ${s.label.toLowerCase()} work in ${props.wardCode}`
  demand.value = demand.value || `${props.wardCode} recorded ₹${sum3(s.actual)} crore spent on ${s.label.toLowerCase()} in 2021-22 to 2023-24, ${util}% of what was allotted. We, residents of this ward, ask the Assistant Municipal Commissioner to publish the list of works, contractors and completion dates behind this spend, and to inspect the locations residents have flagged on this page.`
}
async function create() {
  error.value = ''
  busy.value = true
  try {
    await $fetch('/api/petitions', { method: 'POST', body: { ward: props.wardSlug, service: service.value, title: title.value, demand: demand.value } })
    creating.value = false; title.value = ''; demand.value = ''
    await refresh()
  } catch (e: any) { error.value = e?.data?.statusMessage || 'Could not save.' }
  finally { busy.value = false }
}
async function sign(p: any) {
  if (signed.value[p.id]) return
  signed.value[p.id] = true
  try { const r = await $fetch<{ signatures: number }>(`/api/petitions/${encodeURIComponent(`${p.ward}:${p.id}`)}/sign`, { method: 'POST' }); p.signatures = r.signatures }
  catch { signed.value[p.id] = false }
}
const statusLabel: Record<string, string> = { open: 'Collecting signatures', sent: 'Sent to ward office', answered: 'Answered' }
const statusClass: Record<string, string> = { open: 'yellow', sent: 'blue', answered: 'green' }
async function share(p: any) {
  const text = `${p.title} — ${p.signatures} residents of ${props.wardCode} have signed. Sign it: ${location.href.split('#')[0]}#petitions`
  if (navigator.share) { try { await navigator.share({ text }) } catch {} } else { await navigator.clipboard.writeText(text) }
}
</script>

<template>
  <div class="pet">
    <div class="head">
      <p class="lead">A petition is a grievance with numbers on it. Sign one, or start one from any service.</p>
      <button class="btn primary" type="button" @click="creating = !creating; if (creating) suggest()">{{ creating ? 'Close' : '✍️ Start a petition' }}</button>
    </div>

    <form v-if="creating" class="card white form" @submit.prevent="create">
      <p class="label">About</p>
      <div class="tags">
        <button v-for="s in services" :key="s.key" type="button" class="pill" :class="{ ink: service === s.key }" @click="service = s.key; title = ''; demand = ''; suggest()">{{ s.icon }} {{ s.label }}</button>
      </div>
      <input v-model="title" class="input" maxlength="120" placeholder="Petition title" />
      <textarea v-model="demand" class="input" rows="5" maxlength="600" placeholder="What are you asking the ward office to do?"></textarea>
      <div class="row">
        <button class="btn act" type="submit" :disabled="busy">{{ busy ? 'Saving…' : 'Publish petition' }}</button>
        <span class="fine">Publishes with your signature as the first. Figures are pre-filled from this page.</span>
      </div>
      <p v-if="error" class="err">{{ error }}</p>
    </form>

    <p v-if="!list.length" class="empty">No petitions yet for {{ wardCode }}. Be the first.</p>
    <div class="grid">
      <article v-for="p in list" :key="p.id" class="card item">
        <div class="top">
          <span class="pill">{{ svcOf(p.service)?.icon }} {{ svcOf(p.service)?.label }}</span>
          <span class="pill" :class="statusClass[p.status]">{{ statusLabel[p.status] }}</span>
        </div>
        <h3>{{ p.title }}</h3>
        <p class="demand">{{ p.demand }}</p>
        <div class="foot">
          <div class="sig"><span class="n">{{ p.signatures }}</span> {{ p.signatures === 1 ? 'signature' : 'signatures' }}</div>
          <div class="acts">
            <button class="btn sm act" type="button" :disabled="signed[p.id]" @click="sign(p)">{{ signed[p.id] ? '✓ Signed' : '✍️ Sign' }}</button>
            <button class="btn sm" type="button" @click="share(p)">Share</button>
          </div>
        </div>
      </article>
    </div>
  </div>
</template>

<style scoped>
.pet { display: grid; gap: 18px; }
.head { display: flex; justify-content: space-between; gap: 16px; align-items: center; flex-wrap: wrap; }
.lead { font-weight: 800; margin: 0; max-width: 560px; }
.form { display: grid; gap: 12px; }
.tags { display: flex; flex-wrap: wrap; gap: 8px; }
.tags .pill { cursor: pointer; min-height: 36px; }
.row { display: flex; gap: 12px; align-items: center; flex-wrap: wrap; }
.fine { font-size: 13px; font-weight: 600; }
.err { color: #7a0c00; font-weight: 800; margin: 0; }
.empty { font-weight: 800; }
.grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 18px; }
.item { display: flex; flex-direction: column; gap: 10px; }
.top { display: flex; justify-content: space-between; gap: 8px; flex-wrap: wrap; }
h3 { font-size: 26px; letter-spacing: -0.04em; line-height: 1; }
.demand { margin: 0; font-weight: 600; font-size: 15px; line-height: 1.4; flex: 1; }
.foot { display: flex; justify-content: space-between; align-items: center; gap: 10px; border-top: 2px dashed var(--ink); padding-top: 10px; flex-wrap: wrap; }
.sig { font-weight: 800; }
.sig .n { font-family: var(--display); font-size: 30px; letter-spacing: -0.04em; margin-right: 4px; }
.acts { display: flex; gap: 8px; }
</style>
