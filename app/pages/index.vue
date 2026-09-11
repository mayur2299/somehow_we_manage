<script setup lang="ts">
import { PINCODES } from '~/utils/wards'
import { tagLabel } from '~/utils/tags'
const { ward, pin, area, ready, apply, clear } = useWardContext()
const { openReceipt, openRti } = useWardModals()
const allPins = computed(() => Object.entries(PINCODES).map(([p, v]) => ({ pin: p, area: v[1], slug: v[0] })))
const { data: flags, refresh: refreshFlags } = await useFetch(() => `/api/flags?ward=${useState<string>('ward-slug').value}`, { default: () => ({ counts: {} as Record<string, number>, recent: [] as any[] }), watch: [useState<string>('ward-slug')] })
const posts = computed(() => flags.value?.recent ?? [])
const svcLabel = (k: string) => ward.value.services.find((x: any) => x.key === k)?.label ?? k
const svcIcon = (k: string) => ward.value.services.find((x: any) => x.key === k)?.icon ?? ''
function go(id: string) {
  const el = document.querySelector(id) as HTMLElement | null
  if (!el) return
  const off = (document.querySelector('nav') as HTMLElement)?.offsetHeight ?? 64
  const hub = (document.querySelector('.hub') as HTMLElement)?.offsetHeight ?? 0
  window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - off - hub - 8, behavior: 'smooth' })
}
const { data: pets } = await useFetch(() => `/api/petitions?ward=${useState<string>('ward-slug').value}`, { default: () => ({ petitions: [] as any[] }), watch: [useState<string>('ward-slug')] })
const petitionCount = computed(() => pets.value?.petitions?.length ?? 0)
const heroPost = computed(() => posts.value.find((p: any) => p.photo && p.title) ?? posts.value[0] ?? null)
const cr = (n: number | null) => n == null ? '—' : `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 1 })} cr`
const rs = (n: number) => `₹${n.toLocaleString('en-IN')}`
const pct = (a: number | null, b: number) => a == null ? null : Math.round((a / b) * 100)
const sum3 = (a: (number | null)[]) => a.slice(0, 3).reduce((x, y) => (x ?? 0) + (y ?? 0), 0) as number
const utilClass = (u: number | null) => u == null ? 'purple' : u > 150 ? 'red' : u < 90 ? 'blue' : 'green'
const latestIdxC = computed(() => ward.value.total.ward.actual.map((v: any, i: number) => v == null ? -1 : i).filter((i: number) => i >= 0).pop() ?? 2)
const latestIdx = computed(() => latestIdxC.value)
const latestBE = computed(() => ward.value.total.ward.be[latestIdxC.value])
const latestActual = computed(() => ward.value.total.ward.actual[latestIdxC.value])
const ctx = computed(() => ward.value.cityContext ?? {})
const pinInfo = computed(() => ({ pin: pin.value ?? '', area: area.value }))
function onFound(p: { pin: string; area: string }) { apply(p.pin); window.scrollTo({ top: 0 }) }
useHead({ title: computed(() => ready.value ? `${ward.value.code} ${ward.value.name} · Where My Ward's Money Goes` : `Where My Ward's Money Goes`) })
</script>

<template>
  <div>
    <PinGate v-if="!ready" :pincodes="allPins" @found="onFound" />
    <div v-else class="page">
      <WardNav :ward="ward" :pin="pin" active="" :posts="posts" :hub="false" @change-pin="clear" />
      <main>
        <section class="branches">
          <div class="idline">
            <span class="pill yellow">📍 {{ pin }} · {{ area }}</span>
            <span class="pill">{{ ward.code }} ward · {{ ward.name }}</span>
            <span class="pill">{{ ward.population2025.toLocaleString('en-IN') }} residents</span>
          </div>
          <h1>Your ward.<br>Four questions.</h1>

          <div class="bgrid">
            <NuxtLink class="branch yellow" to="/money">
              <span class="ic">💸</span>
              <h2>Money received<br>vs money spent</h2>
              <div class="num">{{ cr(latestActual) }}</div>
              <p class="d">spent in {{ ward.years[latestIdx] }} against {{ cr(latestBE) }} allotted · <strong>{{ pct(latestActual, latestBE) }}%</strong></p>
              <span class="go">See the split by department →</span>
            </NuxtLink>

            <NuxtLink class="branch pink" to="/forum">
              <span class="ic">💬</span>
              <h2>What residents<br>actually see</h2>
              <div class="num">{{ posts.length }}</div>
              <p class="d">complaints from this ward · {{ posts.filter((p: any) => p.photo).length }} with photos · {{ posts.reduce((a: number, p: any) => a + (p.confirms ?? 0), 0) }} "me too"</p>
              <span class="go">Open the ward chat →</span>
            </NuxtLink>

            <NuxtLink class="branch blue" to="/who">
              <span class="ic">🗳️</span>
              <h2>Who is<br>accountable</h2>
              <div class="num">{{ ward.accountable?.corporators?.length ?? 0 }}</div>
              <p class="d">corporators elected Jan 2026 · ward office · MLAs · four years with no council</p>
              <span class="go">See the names →</span>
            </NuxtLink>

            <NuxtLink class="branch purple" to="/petitions">
              <span class="ic">✍️</span>
              <h2>Petitions<br>and RTI</h2>
              <div class="num">{{ petitionCount }}</div>
              <p class="d">running for this ward · sign one, raise one, or send the BMC a filled RTI</p>
              <span class="go">Take it further →</span>
            </NuxtLink>
          </div>

          <div class="actbar">
            <span class="label">Do something now</span>
            <NuxtLink class="btn flag" :to="{ path: '/forum', query: { post: '1' } }">🚩 Report a problem</NuxtLink>
            <button class="btn primary" @click="openReceipt()">🧾 Make this public</button>
            <button class="btn act" @click="openRti()">📄 Ask the BMC</button>
          </div>
        </section>

        <section v-if="heroPost" class="live">
          <div class="section-head"><h2>Latest from {{ ward.code }}</h2><p>The BMC's numbers are above. This is what a resident posted.</p></div>
          <div class="livegrid">
            <NuxtLink class="card feature pink herocard live" :to="{ path: '/forum', hash: `#post-${heroPost.id}` }">
              <div class="live-top"><span class="pill red">● Live</span><span class="pill">{{ svcIcon(heroPost.service) }} {{ svcLabel(heroPost.service) }}</span></div>
              <img v-if="heroPost.photo" :src="heroPost.photo" alt="" referrerpolicy="no-referrer" />
              <div class="live-title">{{ heroPost.title || heroPost.note }}</div>
              <div class="live-meta">👀 {{ heroPost.confirms ?? 0 }} people say this is still here<span v-if="heroPost.locality"> · 📍 {{ heroPost.locality }}</span></div>
              <div class="live-cta">Open the forum →</div>
            </NuxtLink>
            <div class="latest">
              <NuxtLink v-for="p in posts.slice(1, 4)" :key="p.id" class="card lp" :to="{ path: '/forum', hash: `#post-${p.id}` }">
                <img v-if="p.photo" :src="p.photo" alt="" referrerpolicy="no-referrer" />
                <div>
                  <div class="lp-tags"><span class="pill red">{{ tagLabel(p.tag) }}</span><span class="pill">{{ svcIcon(p.service) }} {{ svcLabel(p.service) }}</span></div>
                  <p class="lp-title">{{ p.title || p.note }}</p>
                  <p class="mini">👀 {{ p.confirms ?? 0 }} me too · 💬 {{ p.comments ?? 0 }}<span v-if="p.locality"> · 📍 {{ p.locality }}</span></p>
                </div>
              </NuxtLink>
            </div>
          </div>
        </section>

<section class="close">
        <h2>You paid.<br>You should know.</h2>
        <p>The BMC is called the richest municipal corporation in the country. Every Mumbai resident pays for their ward. This makes the money visible, and turns "where did it go?" into a question the BMC has to answer.</p>
        <div class="cta-row center"><button class="btn primary" @click="openReceipt()">🧾 Make this public</button><button class="btn" @click="openRti()">Ask the BMC</button><button class="btn act" @click="navigateTo('/petitions')">✍️ Sign a petition</button></div>
      </section>

      <section v-if="ward.todo?.length" class="gaps">
        <div class="card red">
          <span class="pill">Known gaps for {{ ward.code }}</span>
          <ul><li v-for="t in ward.todo" :key="t">{{ t }}</li></ul>
          <p><strong>We show what we verified and say what we did not.</strong> Budget figures are complete for every ward; the contact and representative details are still being compiled outside the pilot ward.</p>
        </div>
      </section>

                  </main>
      <WardModals :ward="ward" :posts="posts" />
      <footer>
        <div class="logo">Somehow We <b>Manage</b></div>
        <div class="disclaimer"><strong>CREATE 2026 prototype · 11 September 2026.</strong> Ward actuals are not published by the BMC; Praja Foundation obtained them under the Right to Information Act. Utilisation above 100% means recorded spend exceeded the allotment.</div>
      </footer>
    </div>
  </div>
</template>

<style scoped>

.ticker { background: var(--ink); color: var(--white); white-space: nowrap; overflow: hidden; border-bottom: 3px solid var(--ink); }
.track { display: inline-block; padding: 10px 0; animation: ticker 28s linear infinite; font-weight: 900; font-size: 13px; }
.track span span { margin-right: 38px; }
@keyframes ticker { to { transform: translateX(-50%); } }
nav { position: sticky; top: 0; z-index: 30; display: flex; align-items: center; justify-content: space-between; gap: 16px; padding: 12px max(5vw, calc((100vw - 1440px) / 2)); background: rgba(244,239,223,.94); backdrop-filter: blur(10px); border-bottom: 2px solid var(--ink); }
.logo { font-weight: 900; font-size: 20px; letter-spacing: -0.045em; white-space: nowrap; }
.logo b { background: var(--yellow); padding: 3px 7px; border: 2px solid var(--ink); border-radius: 7px; box-shadow: 3px 3px 0 var(--ink); }
nav .links { display: flex; gap: 16px; font-weight: 900; font-size: 13px; text-transform: uppercase; }
nav a { text-decoration: none; }
.hero { display: grid; grid-template-columns: 1.15fr .85fr; gap: 34px; padding: 64px max(6vw, calc((100vw - 1440px) / 2)) 48px; align-items: center; border-bottom: 3px solid var(--ink); }
.idbar { display: flex; gap: 8px; flex-wrap: wrap; }
h1 { font-size: clamp(56px, 8.4vw, 128px); line-height: .84; letter-spacing: -.075em; margin: 22px 0; text-transform: uppercase; }
.hero p { font-size: clamp(18px, 2vw, 24px); line-height: 1.25; font-weight: 700; max-width: 760px; }
.cta-row { display: flex; gap: 12px; flex-wrap: wrap; margin-top: 26px; }
.cta-row.center { justify-content: center; }
.herocard { transform: rotate(1.5deg); }
.herocard .slash { font-family: var(--display); font-size: clamp(64px, 9vw, 140px); line-height: .8; letter-spacing: -.07em; margin: 14px 0; }
.herocard p { font-size: 18px; font-weight: 700; margin: 0 0 8px; }
.mini { font-size: 12px; font-weight: 700; color: #3f3b34; }
section { padding: 72px max(6vw, calc((100vw - 1440px) / 2)); border-bottom: 3px solid var(--ink); }
section.hub {
  position: sticky; top: var(--navh, 64px); z-index: 25;
  padding-top: 16px; padding-bottom: 16px; background: var(--ink);
  border-bottom: 3px solid var(--ink);
  transition: padding 160ms ease;
}
section.hub.compact { padding-top: 8px; padding-bottom: 8px; }
section.hub.compact .tile { padding: 8px 12px; box-shadow: 3px 3px 0 rgba(255,255,255,.9); }
section.hub.compact .tile .ic { font-size: 18px; }
section.hub.compact .tile .t { font-size: 15px; }
section.hub.compact .tile .d { display: none; }
.hubgrid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 12px; }
.tile { display: grid; gap: 4px; border: 3px solid var(--ink); border-radius: 16px; padding: 14px; text-decoration: none; color: var(--ink); box-shadow: 5px 5px 0 rgba(255,255,255,.9); transition: transform 120ms, box-shadow 120ms; }
.tile:hover { transform: translate(3px, 3px); box-shadow: 2px 2px 0 rgba(255,255,255,.9); }
.tile.on { outline: 3px solid var(--white); outline-offset: 3px; }
.tile.blue { background: var(--blue); } .tile.yellow { background: var(--yellow); } .tile.green { background: var(--green); } .tile.pink { background: var(--pink); } .tile.purple { background: var(--purple); }
.tile .ic { font-size: 26px; }
.tile .t { font-family: var(--display); font-size: 18px; letter-spacing: -.04em; line-height: 1; }
.tile .d { font-size: 12px; font-weight: 700; }
@media (max-width: 920px) { .hubgrid { grid-template-columns: 1fr 1fr; } }
.section-head { display: flex; align-items: end; justify-content: space-between; gap: 24px; margin-bottom: 28px; }
.section-head h2 { font-size: clamp(42px, 6vw, 84px); line-height: .9; letter-spacing: -.06em; text-transform: uppercase; }
.section-head p { max-width: 480px; font-weight: 700; margin: 0; }
.grid { display: grid; grid-template-columns: repeat(12, 1fr); gap: 18px; }
.span4 { grid-column: span 4; } .span5 { grid-column: span 5; } .span7 { grid-column: span 7; } .span12 { grid-column: span 12; }
h3 { font-size: 34px; letter-spacing: -.05em; line-height: 1; margin: 10px 0; }
.h-sm { font-size: 26px; }
.reps-head { display: flex; justify-content: space-between; gap: 20px; align-items: start; flex-wrap: wrap; }
.reps-head .mini { max-width: 420px; }
.reps { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 10px; margin: 14px 0; }
.rep { display: flex; align-items: center; gap: 10px; border: 2px solid var(--ink); border-radius: 14px; padding: 10px 12px; background: var(--white); }
.rep.kn { border-style: dashed; }
.wn { font-family: var(--display); font-size: 22px; letter-spacing: -.04em; min-width: 32px; }
.rep-body { flex: 1; min-width: 0; }
.nm { font-weight: 800; line-height: 1.2; }
.pt { font-size: 12px; font-weight: 700; color: #3f3b34; }
.mlas { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 10px; margin-top: 14px; }
.mla { display: grid; gap: 6px; border: 2px solid var(--ink); border-radius: 14px; padding: 12px; background: var(--white); align-content: start; }
.mla .btn { justify-self: start; }
.herostat .money { font-family: var(--display); font-size: clamp(48px, 7vw, 100px); line-height: .86; letter-spacing: -.06em; }
.herostat .vs { font-size: 22px; font-weight: 900; margin: 10px 0 18px; }
.herostat p { font-size: 18px; font-weight: 700; margin: 0; }
.utilcard { display: flex; flex-direction: column; justify-content: space-between; }
.utilcard .percent { font-family: var(--display); font-size: clamp(72px, 9vw, 140px); line-height: .8; letter-spacing: -.08em; margin: 12px 0; }
.meter { height: 26px; border: 3px solid var(--ink); background: var(--white); border-radius: 999px; overflow: hidden; }
.meter > div { height: 100%; background: var(--red); border-right: 3px solid var(--ink); transition: width 600ms ease; }
.utilcard p { font-weight: 700; margin: 12px 0 0; }
.stat .n { font-family: var(--display); font-size: clamp(36px, 4vw, 56px); letter-spacing: -.05em; line-height: 1; }
.stat .l { font-weight: 700; font-size: 14px; margin-top: 8px; line-height: 1.35; }
.years { display: grid; }
.year-row { display: grid; grid-template-columns: 84px 1fr 1fr 150px; gap: 12px; align-items: center; padding: 14px 0; border-top: 2px dashed var(--ink); font-weight: 800; }
.year-row small { font-weight: 800; font-size: 12px; }
.bar { height: 18px; border: 2px solid var(--ink); border-radius: 999px; background: var(--white); overflow: hidden; margin-top: 4px; }
.bar > div { height: 100%; background: var(--blue); transition: width 600ms ease; }
.bar.spent > div { background: var(--pink); }
.bar.est { background: repeating-linear-gradient(45deg, #ede7d4, #ede7d4 4px, #fff 4px, #fff 8px); }
.services { display: grid; grid-template-columns: repeat(3, 1fr); gap: 18px; }
.service { min-height: 320px; display: flex; flex-direction: column; justify-content: space-between; gap: 14px; }
.svc-top { display: flex; justify-content: space-between; gap: 8px; }
.service h3 { font-size: 32px; }
.service .pct { font-family: var(--display); font-size: 66px; letter-spacing: -.06em; line-height: 1; }
.service p { font-weight: 700; margin: 6px 0 0; }
.numbers { font-weight: 800; font-size: 14px; border-top: 2px dashed var(--ink); padding-top: 10px; line-height: 1.4; }
.contrast { margin-top: 8px; font-weight: 900; font-size: 14px; background: var(--white); border: 2px solid var(--ink); border-radius: 10px; padding: 8px 10px; }
.svc-actions { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 12px; align-items: center; }
.svc-actions .grow { flex: 1 1 100%; justify-content: center; }
.teaser .big { font-family: var(--display); font-size: clamp(56px, 8vw, 110px); letter-spacing: -.06em; line-height: .9; margin-top: 10px; }
.teaser .vs { font-weight: 900; font-size: 17px; margin: 6px 0 4px; }
.latest { display: grid; gap: 12px; align-content: start; }
.lp { display: grid; grid-template-columns: 96px 1fr; gap: 12px; padding: 10px; text-decoration: none; align-items: center; }
.lp img { width: 96px; height: 96px; object-fit: cover; border: 2px solid var(--ink); border-radius: 10px; }
.lp-tags { display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 4px; }
.lp-title { margin: 0 0 4px; font-weight: 800; font-size: 15px; line-height: 1.25; }
.svc-tabs { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 18px; }
.svc-tabs .pill { cursor: pointer; min-height: 36px; }
.contrast-card .big { font-family: var(--display); font-size: clamp(44px, 6vw, 84px); letter-spacing: -.06em; line-height: .9; margin-top: 10px; }
.contrast-card .vs { font-weight: 900; font-size: 18px; margin: 6px 0 14px; }
.post { padding: 0; overflow: hidden; display: flex; flex-direction: column; }
.post img { width: 100%; height: 180px; object-fit: cover; border-bottom: 3px solid var(--ink); display: block; }
.post-body { padding: 14px; display: grid; gap: 8px; }
.post-tags { display: flex; gap: 6px; flex-wrap: wrap; }
.note { margin: 0; font-weight: 700; }
.post-foot { display: flex; justify-content: space-between; align-items: center; gap: 8px; flex-wrap: wrap; }
.acts { display: flex; gap: 6px; flex-wrap: wrap; }
.empty { font-weight: 800; margin: 0; }
.threads { margin-top: 28px; }
.threads-head { display: flex; justify-content: space-between; align-items: center; gap: 12px; flex-wrap: wrap; }
.thread-list { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 10px; margin: 12px 0; }
.thread { display: grid; gap: 4px; border: 2px solid var(--ink); border-radius: 14px; padding: 12px; background: var(--white); text-decoration: none; box-shadow: 3px 3px 0 var(--ink); }
.t-title { font-weight: 800; line-height: 1.3; }
.meme-zone { background: var(--ink); color: var(--white); }
.meme-zone .section-head p { color: #f2ead5; }
.memes { display: grid; grid-template-columns: repeat(2, 1fr); gap: 22px; }
.meme { min-height: 380px; border: 3px solid var(--white); border-radius: 26px; padding: 26px; display: flex; flex-direction: column; justify-content: space-between; position: relative; overflow: hidden; color: var(--ink); }
.meme.red { background: var(--red); } .meme.blue { background: var(--blue); } .meme.yellow { background: var(--yellow); } .meme.green { background: var(--green); }
.kicker { font-size: 12px; font-weight: 900; border: 2px solid currentColor; display: inline-flex; align-self: flex-start; padding: 6px 9px; border-radius: 999px; background: rgba(255,255,255,.3); text-transform: uppercase; }
.meme .copy { font-family: var(--display); font-size: clamp(30px, 3.6vw, 56px); line-height: .95; letter-spacing: -.05em; margin: 20px 0; }
.desc { font-size: 15px; font-weight: 700; max-width: 90%; line-height: 1.35; margin: 0; }
.meme .emoji { position: absolute; right: 18px; top: 16px; font-size: 64px; transform: rotate(8deg); }
.tablewrap { overflow-x: auto; }
table { border-collapse: collapse; font-size: 13px; min-width: 820px; width: 100%; font-weight: 700; }
th, td { padding: 8px 8px; text-align: right; border-bottom: 2px dashed #c9c2ad; white-space: nowrap; }
thead th { text-align: center; border-bottom: 3px solid var(--ink); }
.sub-h th { font-size: 11px; text-transform: uppercase; letter-spacing: .05em; border-bottom: 2px solid var(--ink); }
tbody th { text-align: left; position: sticky; left: 0; background: var(--surface); }
td.red { color: #9b1c0f; font-weight: 900; } td.blue { color: #0b4f8a; font-weight: 900; } td.green { color: #1f6b2e; font-weight: 900; } td.est { color: #6b5aa8; font-style: italic; }
tr.sep th { padding-top: 16px; text-transform: uppercase; font-size: 11px; letter-spacing: .06em; }
.sources { display: grid; gap: 12px; align-content: start; }
.source { border: 3px solid var(--ink); border-radius: 16px; background: var(--white); padding: 14px 16px; font-weight: 800; text-decoration: none; display: block; }
.source small { display: block; color: #736f63; margin-top: 4px; font-weight: 600; }
.card.red ul { font-weight: 800; line-height: 1.6; padding-left: 20px; }
.close { background: var(--yellow); text-align: center; }
.close h2 { font-size: clamp(52px, 8vw, 116px); line-height: .85; letter-spacing: -.07em; text-transform: uppercase; }
.close p { font-size: 20px; font-weight: 700; max-width: 800px; margin: 24px auto; }
footer { padding: 34px max(6vw, calc((100vw - 1440px) / 2)) 50px; font-weight: 700; }
.disclaimer { background: var(--white); border: 2px dashed var(--ink); padding: 14px; border-radius: 12px; margin-top: 14px; font-size: 14px; }
.pinkbtn { background: var(--pink); }
.herocard.live { display: grid; gap: 10px; text-decoration: none; color: var(--ink); padding: 18px; }
.live-top { display: flex; justify-content: space-between; gap: 8px; flex-wrap: wrap; }
.herocard.live img { width: 100%; height: 220px; object-fit: cover; border: 3px solid var(--ink); border-radius: 14px; display: block; }
.live-title { font-family: var(--display); font-size: clamp(22px, 2.4vw, 32px); letter-spacing: -.04em; line-height: 1.02; }
.live-meta { font-weight: 800; font-size: 14px; }
.live-cta { font-weight: 900; text-decoration: underline; }
.actsec { background: var(--paper); }
.gaps { padding-top: 40px; padding-bottom: 40px; }
.gaps ul { font-weight: 800; line-height: 1.6; padding-left: 20px; }
.actgrid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
.actcard { display: grid; gap: 8px; align-content: start; text-align: left; text-decoration: none; color: var(--ink); cursor: pointer; font: inherit; min-height: 220px; }
.actcard .ic { font-size: 34px; }
.actcard h3 { font-size: 26px; margin: 0; }
.actcard p { margin: 0; font-weight: 700; font-size: 14px; line-height: 1.35; }
.actcard .go { margin-top: auto; font-weight: 900; text-decoration: underline; }
.actcard:hover { transform: translate(3px, 3px); box-shadow: 4px 4px 0 var(--ink); }
.alltable summary { list-style: none; display: inline-flex; margin-bottom: 14px; }
.alltable summary::-webkit-details-marker { display: none; }
@media (max-width: 920px) { .actgrid { grid-template-columns: 1fr 1fr; } }
@media (max-width: 520px) { .actgrid { grid-template-columns: 1fr; } }
.modal { position: fixed; inset: 0; background: rgba(17,17,17,.74); display: grid; place-items: center; padding: 20px; z-index: 99; }
.modal-card { background: var(--paper); border: 3px solid var(--ink); border-radius: 22px; padding: 22px; max-width: 760px; width: 100%; box-shadow: 10px 10px 0 var(--yellow); max-height: 92vh; overflow: auto; display: grid; gap: 14px; }
.modal-top { display: flex; justify-content: space-between; gap: 16px; align-items: start; }
.modal-top h3 { font-size: 36px; margin: 8px 0 4px; }
.x { border: 3px solid var(--ink); background: var(--white); border-radius: 10px; padding: 6px 10px; font-weight: 900; cursor: pointer; }
.confetti { position: fixed; inset: 0; pointer-events: none; z-index: 100; }
.piece { position: absolute; width: 10px; height: 18px; top: -30px; animation: fall 1.8s linear forwards; }
@keyframes fall { to { transform: translateY(110vh) rotate(720deg); } }
.toast { position: fixed; bottom: 18px; left: 50%; transform: translateX(-50%); background: var(--ink); color: var(--white); border-radius: 999px; padding: 10px 16px; font-weight: 800; z-index: 120; }
@media (max-width: 920px) {
  nav .links { display: none; }
  .hero { grid-template-columns: 1fr; padding-top: 40px; }
  .herocard { transform: none; }
  .span4, .span5, .span7 { grid-column: span 12; }
  .services, .memes { grid-template-columns: 1fr; }
  .year-row { grid-template-columns: 64px 1fr; }
  .year-row > div:nth-child(3), .year-row > div:nth-child(4) { grid-column: 2; }
  .section-head { align-items: start; flex-direction: column; }
  section { padding: 48px 20px; }
}

.page { background: var(--paper); min-height: 100vh; }

.branches { padding-top: 40px; }
.idline { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 18px; }
.branches h1 { font-size: clamp(44px, 7vw, 104px); line-height: .86; letter-spacing: -.07em; text-transform: uppercase; margin: 0 0 28px; }
.bgrid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; }
.branch { display: grid; gap: 6px; align-content: start; border: 3px solid var(--ink); border-radius: 24px; padding: 24px; text-decoration: none; color: var(--ink); box-shadow: 8px 8px 0 var(--ink); transition: transform 130ms, box-shadow 130ms; min-height: 260px; }
.branch:hover { transform: translate(4px, 4px); box-shadow: 4px 4px 0 var(--ink); }
.branch.yellow { background: var(--yellow); } .branch.pink { background: var(--pink); } .branch.blue { background: var(--blue); } .branch.purple { background: var(--purple); }
.branch .ic { font-size: 34px; }
.branch h2 { font-size: clamp(26px, 2.6vw, 36px); letter-spacing: -.05em; line-height: .98; margin: 2px 0 4px; text-transform: none; }
.branch .num { font-family: var(--display); font-size: clamp(44px, 5vw, 68px); letter-spacing: -.06em; line-height: 1; }
.branch .d { margin: 0; font-weight: 700; font-size: 14px; line-height: 1.35; }
.branch .go { margin-top: auto; font-weight: 900; text-decoration: underline; padding-top: 10px; }
.actbar { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; margin-top: 22px; border: 3px dashed var(--ink); border-radius: 18px; padding: 16px 18px; }
.actbar .label { font-size: 12px; font-weight: 900; text-transform: uppercase; letter-spacing: .08em; margin-right: 4px; }
.live .livegrid { display: grid; grid-template-columns: 5fr 7fr; gap: 18px; }
@media (max-width: 920px) { .bgrid { grid-template-columns: 1fr; } .live .livegrid { grid-template-columns: 1fr; } }
</style>
