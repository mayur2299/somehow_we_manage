<script setup lang="ts">
import { WARDS, resolvePin, DEFAULT_SLUG } from '~/utils/wards'
const route = useRoute()
const slug = ref(typeof route.query.ward === 'string' && WARDS[route.query.ward] ? String(route.query.ward) : DEFAULT_SLUG)
const ward = computed(() => WARDS[slug.value])
const wardSlug = computed(() => slug.value)
const initial = typeof route.query.service === 'string' ? String(route.query.service) : undefined
const openForm = route.query.post === '1'

// PIN context: keep the ward identity; if none, send to the gate
const pin = ref<string | null>(null)
onMounted(() => {
  try {
    const q = new URLSearchParams(location.search).get('pin')
    const saved = localStorage.getItem('wmwmg:pin')
    pin.value = q || saved
    if (q) localStorage.setItem('wmwmg:pin', q)
    if (!pin.value) { navigateTo('/'); return }
    const hit = resolvePin(pin.value!)
    if (hit) slug.value = hit.slug
  } catch {}
})
const area = computed(() => ward.value.pincodes.find((p: any) => p.pin === pin.value)?.area ?? ward.value.name)

const { data: flags, refresh: refreshFlags } = await useFetch(() => `/api/flags?ward=${slug.value}`, { default: () => ({ counts: {} as Record<string, number>, recent: [] as any[] }) })
const posts = computed(() => flags.value?.recent ?? [])

const selected = ref(initial ?? 'swd')
const svc = computed(() => ward.value.services.find((s: any) => s.key === selected.value) ?? ward.value.services[0])
const receiptOpen = ref(false)
const receiptPost = ref<any | null>(null)
function openReceipt(k: string, post?: any) { selected.value = k; receiptPost.value = post ?? null; receiptOpen.value = true }
const siteUrl = computed(() => (typeof location !== 'undefined' ? location.origin : 'https://somehow-we-manage.netlify.app'))
const confettiOn = ref(false)
function celebrate() { confettiOn.value = true; setTimeout(() => (confettiOn.value = false), 2200) }
const confetti = Array.from({ length: 28 }, (_, i) => ({ left: `${(i * 37) % 100}vw`, delay: `${(i % 7) * 0.05}s`, bg: ['#ffd84d', '#b7ff4a', '#ff88c7', '#85c7ff'][i % 4] }))
function toPetitions() { navigateTo({ path: '/', hash: '#petitions' }) }
useHead({ title: computed(() => `${ward.value.code} residents · Where My Ward's Money Goes`) })
</script>

<template>
  <div class="fpage">
    <WardNav :ward="ward" :pin="pin" active="forum" :posts="posts" @change-pin="() => { localStorage.removeItem('wmwmg:pin'); navigateTo('/') }" />
    <Forum full :ward-slug="wardSlug" :ward-code="ward.code" :ward-name="ward.name" :services="ward.services" :posts="posts" :counts="flags?.counts ?? {}" :initial-service="initial" :open-form="openForm" @refresh="refreshFlags()" @celebrate="celebrate()" @petition="toPetitions" @petitions-changed="() => {}" @receipt="openReceipt" />

    <div v-if="receiptOpen" class="modal" @click.self="receiptOpen = false">
      <div class="modal-card">
        <div class="modal-top">
          <div><span class="pill pink">The receipt</span><h3>{{ receiptPost ? 'Your complaint, as a card.' : 'Savage. Sourced. Shareable.' }}</h3></div>
          <button class="x" @click="receiptOpen = false" aria-label="Close">✕</button>
        </div>
        <div class="svc-tabs"><button v-for="s in ward.services" :key="s.key" class="pill" :class="{ ink: selected === s.key }" @click="selected = s.key">{{ s.icon }} {{ s.label }}</button></div>
        <Receipt :ward-code="ward.code" :ward-name="ward.name" :service="svc" :posts="posts" :site-url="siteUrl" :post="receiptPost" />
      </div>
    </div>
    <div v-if="confettiOn" class="confetti" aria-hidden="true"><i v-for="(c, i) in confetti" :key="i" class="piece" :style="{ left: c.left, animationDelay: c.delay, background: c.bg }"></i></div>
  </div>
</template>

<style scoped>
.fpage { min-height: 100vh; background: var(--paper); }
nav { height: 70px; display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 0 max(4vw, calc((100vw - 860px) / 2)); border-bottom: 3px solid var(--ink); background: var(--paper); position: sticky; top: 0; z-index: 30; }
.logo { font-weight: 900; font-size: 18px; letter-spacing: -0.045em; white-space: nowrap; }
.logo b { background: var(--yellow); padding: 3px 7px; border: 2px solid var(--ink); border-radius: 7px; box-shadow: 3px 3px 0 var(--ink); }
.pins { display: flex; gap: 6px; }
.svc-tabs { display: flex; flex-wrap: wrap; gap: 8px; }
.svc-tabs .pill { cursor: pointer; min-height: 36px; }
.modal { position: fixed; inset: 0; background: rgba(17,17,17,.74); display: grid; place-items: center; padding: 20px; z-index: 99; }
.modal-card { background: var(--paper); border: 3px solid var(--ink); border-radius: 22px; padding: 22px; max-width: 760px; width: 100%; box-shadow: 10px 10px 0 var(--yellow); max-height: 92vh; overflow: auto; display: grid; gap: 14px; }
.modal-top { display: flex; justify-content: space-between; gap: 16px; align-items: start; }
.modal-top h3 { font-size: 32px; margin: 8px 0 4px; }
.x { border: 3px solid var(--ink); background: var(--white); border-radius: 10px; padding: 6px 10px; font-weight: 900; cursor: pointer; }
.confetti { position: fixed; inset: 0; pointer-events: none; z-index: 100; }
.piece { position: absolute; width: 10px; height: 18px; top: -30px; animation: fall 1.8s linear forwards; }
@keyframes fall { to { transform: translateY(110vh) rotate(720deg); } }
@media (max-width: 600px) { .logo { display: none; } }
</style>
