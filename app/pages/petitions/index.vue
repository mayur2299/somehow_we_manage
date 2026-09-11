<script setup lang="ts">
import { WARDS, resolvePin, DEFAULT_SLUG } from '~/utils/wards'
const route = useRoute()
const slug = ref(typeof route.query.ward === 'string' && WARDS[route.query.ward] ? String(route.query.ward) : DEFAULT_SLUG)
const ward = computed(() => WARDS[slug.value])
const { data, refresh } = await useFetch(() => `/api/petitions?ward=${slug.value}`, { default: () => ({ petitions: [] as any[] }) })
const list = computed(() => data.value?.petitions ?? [])
const groups = computed(() => ward.value.services.map(s => ({ ...s, items: list.value.filter((p: any) => p.service === s.key).sort((a: any, b: any) => b.signatures - a.signatures) })).filter(g => g.items.length))
const total = computed(() => list.value.reduce((a: number, p: any) => a + p.signatures, 0))
const signed = ref<Record<string, boolean>>({})
async function sign(p: any) {
  if (signed.value[p.id]) return
  signed.value[p.id] = true
  try { await $fetch(`/api/petitions/${encodeURIComponent(`${p.ward}:${p.id}`)}/sign`, { method: 'POST' }); await refresh() } catch { signed.value[p.id] = false }
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
    <WardNav :ward="ward" :pin="pin" active="petitions" @change-pin="() => { localStorage.removeItem('wmwmg:pin'); navigateTo('/') }" />
    <main>
      <header class="head">
        <span class="pill green">{{ ward.code }} · {{ ward.name }}</span>
        <h1>Petitions.<br>By type.</h1>
        <p><strong>{{ list.length }}</strong> {{ list.length === 1 ? 'petition' : 'petitions' }} · <strong>{{ total }}</strong> {{ total === 1 ? 'signature' : 'signatures' }} · no login. Every one carries the ward's own spend figures and is addressed to the ward office.</p>
        <NuxtLink class="btn primary" :to="{ path: '/', hash: '#petitions' }">✍️ Start a petition</NuxtLink>
      </header>

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
      <p v-if="!groups.length" class="empty">No petitions yet for {{ ward.code }}. Start one from a complaint in the <NuxtLink to="/forum">forum</NuxtLink>.</p>
    </main>
  </div>
</template>

<style scoped>
.ppage { min-height: 100vh; background: var(--paper); }
nav { height: 70px; display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 0 max(4vw, calc((100vw - 1100px) / 2)); border-bottom: 3px solid var(--ink); position: sticky; top: 0; background: var(--paper); z-index: 30; }
.logo { font-weight: 900; font-size: 18px; letter-spacing: -0.045em; white-space: nowrap; }
.logo b { background: var(--yellow); padding: 3px 7px; border: 2px solid var(--ink); border-radius: 7px; box-shadow: 3px 3px 0 var(--ink); }
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
</style>
