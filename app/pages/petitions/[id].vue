<script setup lang="ts">
import ward from '~/data/k-east.json'
const route = useRoute()
const id = String(route.params.id)
const { data, refresh } = await useFetch<{ petition: any }>(`/api/petitions/${encodeURIComponent(id)}`)
const p = computed(() => data.value?.petition)
const svc = computed(() => ward.services.find(s => s.key === p.value?.service))
const sum3 = (a: (number | null)[]) => a.slice(0, 3).reduce((x, y) => (x ?? 0) + (y ?? 0), 0) as number
const signed = ref(false)
const status = ref('')
async function sign() {
  if (signed.value || !p.value) return
  signed.value = true
  try { await $fetch(`/api/petitions/${encodeURIComponent(`${p.value.ward}:${p.value.id}`)}/sign`, { method: 'POST' }); await refresh(); status.value = 'Signed. Your name is on it.' } catch { signed.value = false }
}
function url() { return `${location.origin}/petitions/${id}` }
async function share(kind: 'wa' | 'x' | 'copy' | 'native') {
  if (!p.value) return
  const text = `${p.value.title} — ${p.value.signatures} residents of ${ward.code} ${ward.name} have signed. Sign it: ${url()}`
  if (kind === 'wa') window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank')
  else if (kind === 'x') window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text.slice(0, 260))}`, '_blank')
  else if (kind === 'copy') { try { await navigator.clipboard.writeText(url()); status.value = 'Link copied.' } catch {} }
  else if (navigator.share) { try { await navigator.share({ text }) } catch {} }
}
const statusLabel: Record<string, string> = { open: 'Collecting signatures', sent: 'Sent to ward office', answered: 'Answered' }
const statusClass: Record<string, string> = { open: 'yellow', sent: 'blue', answered: 'green' }
const steps = [
  { k: 'open', t: 'Collecting signatures', d: 'Residents sign. The count is public.' },
  { k: 'sent', t: 'Sent to ward office', d: `Delivered to the Assistant Municipal Commissioner, ${ward.code}.` },
  { k: 'answered', t: 'Answered', d: 'The ward office replied. Reply is published here.' },
]
const stepIdx = computed(() => ['open', 'sent', 'answered'].indexOf(p.value?.status ?? 'open'))
useHead({ title: computed(() => p.value ? `${p.value.title} · Petition` : 'Petition') })
</script>

<template>
  <div class="ppage">
    <nav>
      <NuxtLink class="btn sm" to="/petitions">← All petitions</NuxtLink>
      <div class="logo">Where My Ward's <b>Money Goes</b></div>
      <NuxtLink class="btn sm" to="/forum">💬 Forum</NuxtLink>
    </nav>
    <main v-if="p">
      <header class="head card white">
        <div class="top"><span class="pill">{{ svc?.icon }} {{ svc?.label }}</span><span class="pill" :class="statusClass[p.status]">{{ statusLabel[p.status] }}</span><span class="pill">{{ ward.code }} · {{ ward.name }}</span></div>
        <h1>{{ p.title }}</h1>
        <div class="sigrow">
          <div class="sig"><span class="n">{{ p.signatures }}</span><span class="t">{{ p.signatures === 1 ? 'signature' : 'signatures' }}</span></div>
          <button class="btn act big" :disabled="signed" @click="sign">{{ signed ? '✓ Signed' : '✍️ Sign this petition' }}</button>
        </div>
        <p class="status" aria-live="polite">{{ status }}</p>
      </header>

      <section class="grid">
        <article class="card span7">
          <span class="pill">The ask</span>
          <p class="demand">{{ p.demand }}</p>
          <p class="mini">Addressed to the Assistant Municipal Commissioner, {{ ward.code }} Ward, {{ ward.accountable.wardOffice.address }}.</p>
        </article>
        <article class="card pink span5">
          <span class="pill">On paper</span>
          <div class="big">₹{{ sum3(svc?.actual ?? []) }} cr</div>
          <div class="vs">spent on {{ svc?.label.toLowerCase() }} · {{ Math.round((svc?.avgUtil ?? 0) * 100) }}% of budget · 2021-22 to 2023-24</div>
          <NuxtLink v-if="p.fromFlag" class="btn sm" :to="{ path: '/forum', hash: `#post-${p.fromFlag}` }">See the complaint it came from →</NuxtLink>
        </article>
        <article class="card span12">
          <span class="pill">Status</span>
          <ol class="steps">
            <li v-for="(s, i) in steps" :key="s.k" :class="{ done: i <= stepIdx, now: i === stepIdx }"><span class="dot"></span><div><strong>{{ s.t }}</strong><p>{{ s.d }}</p></div></li>
          </ol>
        </article>
        <article class="card yellow span12 share">
          <span class="pill">Make it travel</span>
          <h3>{{ p.signatures }} signed. Get to {{ Math.max(50, Math.ceil((p.signatures + 1) / 50) * 50) }}.</h3>
          <div class="acts">
            <button class="btn" @click="share('wa')">WhatsApp</button>
            <button class="btn" @click="share('x')">X</button>
            <button class="btn" @click="share('copy')">Copy link</button>
            <button class="btn primary" @click="share('native')">Share…</button>
          </div>
        </article>
      </section>
    </main>
    <main v-else class="nf"><h1>Petition not found.</h1><NuxtLink class="btn" to="/petitions">All petitions →</NuxtLink></main>
  </div>
</template>

<style scoped>
.ppage { min-height: 100vh; background: var(--paper); }
nav { height: 70px; display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 0 max(4vw, calc((100vw - 1000px) / 2)); border-bottom: 3px solid var(--ink); position: sticky; top: 0; background: var(--paper); z-index: 30; }
.logo { font-weight: 900; font-size: 18px; letter-spacing: -0.045em; white-space: nowrap; }
.logo b { background: var(--yellow); padding: 3px 7px; border: 2px solid var(--ink); border-radius: 7px; box-shadow: 3px 3px 0 var(--ink); }
main { max-width: 1000px; margin: 0 auto; padding: 32px 4vw 80px; display: grid; gap: 22px; }
.head { display: grid; gap: 14px; }
.top { display: flex; gap: 8px; flex-wrap: wrap; }
h1 { font-size: clamp(34px, 5vw, 64px); letter-spacing: -.06em; line-height: .9; }
.sigrow { display: flex; align-items: center; justify-content: space-between; gap: 16px; flex-wrap: wrap; }
.sig { display: flex; align-items: baseline; gap: 8px; }
.sig .n { font-family: var(--display); font-size: clamp(56px, 8vw, 96px); letter-spacing: -.06em; line-height: 1; }
.sig .t { font-weight: 900; text-transform: uppercase; font-size: 14px; }
.btn.big { font-size: 20px; padding: 14px 22px; }
.status { font-weight: 900; min-height: 22px; margin: 0; }
.grid { display: grid; grid-template-columns: repeat(12, 1fr); gap: 18px; }
.span5 { grid-column: span 5; } .span7 { grid-column: span 7; } .span12 { grid-column: span 12; }
.demand { font-size: 18px; font-weight: 600; line-height: 1.45; margin: 10px 0; white-space: pre-wrap; }
.mini { font-size: 12px; font-weight: 700; color: #3f3b34; margin: 0; }
.big { font-family: var(--display); font-size: clamp(40px, 6vw, 72px); letter-spacing: -.06em; line-height: .9; margin: 10px 0 4px; }
.vs { font-weight: 800; margin-bottom: 12px; }
.steps { list-style: none; margin: 12px 0 0; padding: 0; display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
.steps li { display: flex; gap: 10px; align-items: flex-start; opacity: .5; }
.steps li.done { opacity: 1; }
.dot { width: 18px; height: 18px; border-radius: 50%; border: 3px solid var(--ink); background: var(--white); flex: none; margin-top: 2px; }
.steps li.done .dot { background: var(--ink); }
.steps li.now .dot { background: var(--green); }
.steps p { margin: 2px 0 0; font-size: 13px; font-weight: 600; }
.share h3 { font-size: 30px; margin: 8px 0 12px; }
.acts { display: flex; gap: 10px; flex-wrap: wrap; }
.nf { text-align: center; justify-items: center; }
@media (max-width: 800px) { .span5, .span7 { grid-column: span 12; } .steps { grid-template-columns: 1fr; } .logo { display: none; } }
</style>
