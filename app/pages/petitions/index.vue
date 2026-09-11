<script setup lang="ts">
import { WARDS, resolvePin, DEFAULT_SLUG } from '~/utils/wards'
const route = useRoute()
const slug = ref(typeof route.query.ward === 'string' && WARDS[route.query.ward] ? String(route.query.ward) : DEFAULT_SLUG)
const ward = computed(() => WARDS[slug.value])
const { ward: wardCtx, pin: pinCtx, clear } = useWardContext()
const flags = ref<{ recent: any[] }>({ recent: [] })
onMounted(async () => { try { flags.value = await $fetch(`/api/flags?ward=${slug.value}`) } catch {} })
const posts = computed(() => flags.value.recent ?? [])
const data = ref<{ petitions: any[] }>({ petitions: [] })
async function refresh() { try { data.value = await $fetch(`/api/petitions?ward=${slug.value}`) } catch {} }
onMounted(refresh); watch(slug, refresh)
const list = computed(() => data.value.petitions ?? [])
const groups = computed(() => ward.value.services.map(s => ({ ...s, items: list.value.filter((p: any) => p.service === s.key).sort((a: any, b: any) => b.signatures - a.signatures) })).filter(g => g.items.length))
const total = computed(() => list.value.reduce((a: number, p: any) => a + p.signatures, 0))
const signed = ref<Record<string, boolean>>({})
async function sign(p: any) {
  if (signed.value[p.id]) return
  signed.value[p.id] = true
  try { await $fetch(`/api/petitions/${encodeURIComponent(`${p.ward}:${p.id}`)}/sign`, { method: 'POST' }); await refresh() } catch { signed.value[p.id] = false }
}
// create
const creating = ref(false)
const service = ref('')
const title = ref('')
const demand = ref('')
const busy = ref(false)
const error = ref('')
function suggest() {
  if (!service.value) service.value = [...ward.value.services].sort((a: any, b: any) => (b.avgUtil ?? 0) - (a.avgUtil ?? 0))[0].key
  const s = ward.value.services.find((x: any) => x.key === service.value)!
  const util = Math.round((s.avgUtil ?? 0) * 100)
  if (!title.value) title.value = `Show us the ${s.label.toLowerCase()} work in ${ward.value.code}`
  if (!demand.value) demand.value = `${ward.value.code} (${ward.value.name}) recorded ₹${Math.round(sum3(s.actual))} crore spent on ${s.label.toLowerCase()} between 2021-22 and 2023-24, about ${util}% of what was allotted. We, residents of this ward, ask the Assistant Municipal Commissioner to publish the list of works, their contractors and completion dates, and to inspect the locations residents have flagged on this site.`
}
async function create() {
  error.value = ''
  busy.value = true
  try {
    await $fetch('/api/petitions', { method: 'POST', body: { ward: slug.value, service: service.value, title: title.value, demand: demand.value } })
    creating.value = false; title.value = ''; demand.value = ''
    await refresh()
  } catch (e: any) { error.value = e?.data?.statusMessage || 'Could not publish.' }
  finally { busy.value = false }
}

const statusLabel: Record<string, string> = { open: 'Collecting signatures', sent: 'Sent to ward office', answered: 'Answered' }
const statusClass: Record<string, string> = { open: 'yellow', sent: 'blue', answered: 'green' }
const sum3 = (a: (number | null)[]) => a.slice(0, 3).reduce((x, y) => (x ?? 0) + (y ?? 0), 0) as number
const pin = ref<string | null>(null)
onMounted(() => { try { pin.value = new URLSearchParams(location.search).get('pin') || localStorage.getItem('wmwmg:pin'); const h = pin.value ? resolvePin(pin.value) : null; if (h) { slug.value = h.slug; refresh() } } catch {} })
useHead({ title: computed(() => `Petitions · ${ward.value.code}`) })
</script>

<template>
  <div class="ppage">
    <WardNav :ward="ward" :pin="pin" :posts="posts" active="petitions" @change-pin="clear" />
    <main>
      <header class="head">
        <span class="pill green">{{ ward.code }} · {{ ward.name }}</span>
        <h1>Petitions.<br>By type.</h1>
        <p><strong>{{ list.length }}</strong> {{ list.length === 1 ? 'petition' : 'petitions' }} · <strong>{{ total }}</strong> {{ total === 1 ? 'signature' : 'signatures' }} · no login. Every one carries the ward's own spend figures and is addressed to the ward office.</p>
        <button class="btn primary" @click="creating = !creating; if (creating) suggest()">{{ creating ? 'Cancel' : '✍️ Start a petition' }}</button>
      </header>

      <form v-if="creating" class="card make" @submit.prevent="create">
        <p class="label">What is it about</p>
        <div class="tags">
          <button v-for="s in ward.services" :key="s.key" type="button" class="pill" :class="{ ink: service === s.key }" @click="service = s.key; title = ''; demand = ''; suggest()">{{ s.icon }} {{ s.label }}</button>
        </div>
        <input v-model="title" class="input" maxlength="120" placeholder="Petition title" />
        <textarea v-model="demand" class="input" rows="6" maxlength="600" placeholder="What are you asking the ward office to do?"></textarea>
        <div class="row">
          <button class="btn act" type="submit" :disabled="busy">{{ busy ? 'Publishing…' : 'Publish petition' }}</button>
          <span class="mini">Publishes with your signature as the first. The ward's own figures are pre-filled.</span>
        </div>
        <p v-if="error" class="err">{{ error }}</p>
      </form>

      <section v-for="g in groups" :key="g.key" class="group">
        <div class="ghead">
          <h2>{{ g.icon }} {{ g.label }}</h2>
          <span class="pill" :class="g.avgUtil > 1.5 ? 'red' : g.avgUtil < 0.9 ? 'blue' : 'green'">₹{{ sum3(g.actual) }} cr spent · {{ Math.round(g.avgUtil * 100) }}% of budget</span>
          <span class="pill">{{ g.items.length }} petition{{ g.items.length === 1 ? '' : 's' }}</span>
        </div>
        <div class="grid">
          <article v-for="p in g.items" :key="p.id" :id="`p-${p.id}`" class="card item">
            <div class="top"><span class="pill" :class="statusClass[p.status]">{{ statusLabel[p.status] }}</span><span class="mini">{{ new Date(p.ts).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) }}</span></div>
            <NuxtLink class="title" :to="`/petitions/${p.id}`">{{ p.title }}</NuxtLink>
            <p class="demand">{{ p.demand }}</p>
            <div class="foot">
              <div class="sig"><span class="n">{{ p.signatures }}</span> {{ p.signatures === 1 ? 'signature' : 'signatures' }}</div>
              <div class="acts">
                <button class="btn sm act" :disabled="signed[p.id]" @click="sign(p)">{{ signed[p.id] ? '✓ Signed' : '✍️ Sign' }}</button>
                <NuxtLink class="btn sm" :to="`/petitions/${p.id}`">Open →</NuxtLink>
              </div>
            </div>
            <NuxtLink v-if="p.fromFlag" class="mini from" :to="{ path: '/forum', hash: `#post-${p.fromFlag}` }">Raised from a complaint in the forum →</NuxtLink>
          </article>
        </div>
      </section>
      <div v-if="!groups.length && !creating" class="card empty">
        <h2>No petitions yet for {{ ward.code }}.</h2>
        <p>A petition is a grievance with the ward's own numbers attached. Start one here, or raise one from any complaint in the forum.</p>
        <div class="row">
          <button class="btn primary" @click="creating = true; suggest()">✍️ Start a petition</button>
          <NuxtLink class="btn" to="/forum">Go to the forum →</NuxtLink>
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped>
.ppage { min-height: 100vh; background: var(--paper); }
nav { height: 70px; display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 0 max(4vw, calc((100vw - 1100px) / 2)); border-bottom: 3px solid var(--ink); position: sticky; top: 0; background: var(--paper); z-index: 30; }
.logo { font-weight: 900; font-size: 18px; letter-spacing: -0.045em; white-space: nowrap; }
.kye { display: inline-grid; gap: 1px; background: var(--ink); border: 2px solid var(--coral); border-radius: 4px; padding: 4px 7px; transform: rotate(-1.5deg); line-height: .86; }
.kye b { font-family: var(--display); font-size: 15px; letter-spacing: -.03em; color: var(--white); text-transform: uppercase; }
.pins { display: flex; gap: 6px; align-items: center; }
main { max-width: 1100px; margin: 0 auto; padding: 40px 4vw 80px; display: grid; gap: 40px; }
.head { display: grid; gap: 14px; justify-items: start; }
h1 { font-size: clamp(48px, 8vw, 110px); letter-spacing: -.07em; line-height: .84; text-transform: uppercase; }
.head p { font-size: 18px; font-weight: 700; max-width: 640px; margin: 0; }
.group { display: grid; gap: 14px; }
.ghead { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; border-bottom: 3px solid var(--ink); padding-bottom: 10px; }
h2 { font-size: 34px; letter-spacing: -.05em; flex: 1; }
.grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 18px; }
.item { display: flex; flex-direction: column; gap: 10px; }
.top { display: flex; justify-content: space-between; align-items: center; gap: 8px; }
.title { font-family: var(--display); font-size: 24px; letter-spacing: -.04em; line-height: 1; color: var(--ink); text-decoration: none; }
.title:hover { text-decoration: underline; }
.demand { margin: 0; font-weight: 600; font-size: 14px; line-height: 1.4; flex: 1; display: -webkit-box; -webkit-line-clamp: 4; -webkit-box-orient: vertical; overflow: hidden; }
.foot { display: flex; justify-content: space-between; align-items: center; gap: 10px; border-top: 2px dashed var(--ink); padding-top: 10px; flex-wrap: wrap; }
.sig { font-weight: 800; }
.sig .n { font-family: var(--display); font-size: 30px; letter-spacing: -.04em; margin-right: 4px; }
.acts { display: flex; gap: 8px; }
.mini { font-size: 12px; font-weight: 700; color: var(--muted); }
.from { text-decoration: underline; color: var(--muted); }
.empty { font-weight: 800; }
@media (max-width: 600px) { .logo { display: none; } }

.make { display: grid; gap: 10px; }
.make .tags { display: flex; flex-wrap: wrap; gap: 8px; }
.make .tags .pill { cursor: pointer; min-height: 36px; }
.make .row, .empty .row { display: flex; gap: 12px; align-items: center; flex-wrap: wrap; }
.label { font-size: 12px; font-weight: 900; text-transform: uppercase; letter-spacing: .06em; margin: 0; }
.err { color: var(--coral); font-weight: 800; margin: 0; }
.empty { display: grid; gap: 10px; }
.empty h2 { font-size: 30px; }
.empty p { margin: 0; font-weight: 700; }
</style>
