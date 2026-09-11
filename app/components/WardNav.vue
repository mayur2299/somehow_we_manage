<script setup lang="ts">
const props = defineProps<{ ward: any; pin: string | null; active: string; posts?: any[]; hub?: boolean }>()
const emit = defineEmits<{ (e: 'changePin'): void }>()
const cr = (n: number | null) => n == null ? '—' : `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 1 })} cr`
const latestIdx = computed(() => props.ward.total.ward.actual.map((v: any, i: number) => v == null ? -1 : i).filter((i: number) => i >= 0).pop() ?? 2)
const navEl = ref<HTMLElement | null>(null)
const compact = ref(false)
function syncNavHeight() { document.documentElement.style.setProperty('--navh', `${navEl.value?.offsetHeight ?? 64}px`) }
onMounted(() => {
  syncNavHeight()
  const onScroll = () => { compact.value = window.scrollY > 160 }
  onScroll()
  window.addEventListener('scroll', onScroll, { passive: true })
  window.addEventListener('resize', syncNavHeight)
  onBeforeUnmount(() => { window.removeEventListener('scroll', onScroll); window.removeEventListener('resize', syncNavHeight) })
})
const tiles = computed(() => [
  { key: 'who', to: '/who', cls: 'blue', ic: '🗳️', t: 'Who represents you', d: `${props.ward.accountable?.corporators?.length ?? 0} corporators · ward office` },
  { key: 'money', to: '/money', cls: 'yellow', ic: '💸', t: 'Money received vs spent', d: `${cr(props.ward.total.ward.be[latestIdx.value])} allotted · ${cr(props.ward.total.ward.actual[latestIdx.value])} spent` },
  { key: 'forum', to: '/forum', cls: 'pink', ic: '💬', t: `Forum for ${props.pin ?? props.ward.code}`, d: `${props.posts?.length ?? 0} complaints · photos · me too` },
  { key: 'petitions', to: '/petitions', cls: 'purple', ic: '✍️', t: 'Petitions', d: 'Sign, check status, raise one' },
])
</script>

<template>
  <div>
    <nav ref="navEl">
      <NuxtLink class="logo" to="/">Where My Ward's <b>Money Goes</b></NuxtLink>
      <div class="right">
        <span class="pill yellow">{{ ward.code }} · {{ ward.name }}</span>
        <button class="btn sm" @click="emit('changePin')">📍 {{ pin ?? '——' }} · change</button>
      </div>
    </nav>
    <div v-if="hub !== false" class="hub" :class="{ compact }">
      <div class="hubgrid">
        <NuxtLink v-for="t in tiles" :key="t.key" class="tile" :class="[t.cls, { on: active === t.key }]" :to="t.to">
          <span class="ic">{{ t.ic }}</span><span class="t">{{ t.t }}</span><span class="d">{{ t.d }}</span>
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<style scoped>
nav { position: sticky; top: 0; z-index: 30; display: flex; align-items: center; justify-content: space-between; gap: 16px; padding: 12px max(5vw, calc((100vw - 1440px) / 2)); background: rgba(244,239,223,.96); backdrop-filter: blur(10px); border-bottom: 2px solid var(--ink); }
.logo { font-weight: 900; font-size: 20px; letter-spacing: -0.045em; white-space: nowrap; text-decoration: none; color: var(--ink); }
.logo b { background: var(--yellow); padding: 3px 7px; border: 2px solid var(--ink); border-radius: 7px; box-shadow: 3px 3px 0 var(--ink); }
.right { display: flex; gap: 8px; align-items: center; }
.hub { position: sticky; top: var(--navh, 64px); z-index: 25; background: var(--ink); border-bottom: 3px solid var(--ink); padding: 14px max(6vw, calc((100vw - 1440px) / 2)); transition: padding 160ms ease; }
.hub.compact { padding-top: 8px; padding-bottom: 8px; }
.hub.compact .tile { padding: 8px 12px; box-shadow: 3px 3px 0 rgba(255,255,255,.9); }
.hub.compact .tile .ic { font-size: 17px; }
.hub.compact .tile .t { font-size: 15px; }
.hub.compact .tile .d { display: none; }
.hubgrid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
.tile { display: grid; gap: 3px; border: 3px solid var(--ink); border-radius: 16px; padding: 12px; text-decoration: none; color: var(--ink); box-shadow: 5px 5px 0 rgba(255,255,255,.9); transition: transform 120ms, box-shadow 120ms; }
.tile:hover { transform: translate(3px, 3px); box-shadow: 2px 2px 0 rgba(255,255,255,.9); }
.tile.on { outline: 3px solid var(--white); outline-offset: 3px; }
.tile.blue { background: var(--blue); } .tile.yellow { background: var(--yellow); } .tile.green { background: var(--green); } .tile.pink { background: var(--pink); } .tile.purple { background: var(--purple); }
.tile .ic { font-size: 24px; }
.tile .t { font-family: var(--display); font-size: 17px; letter-spacing: -.04em; line-height: 1; }
.tile .d { font-size: 12px; font-weight: 700; }
@media (max-width: 920px) { .hubgrid { grid-template-columns: repeat(2, 1fr); } .logo { font-size: 16px; } .right .pill { display: none; } }
</style>
