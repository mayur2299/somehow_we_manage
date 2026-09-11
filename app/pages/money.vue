<script setup lang="ts">
import { tagLabel } from '~/utils/tags'
const { ward, pin, area, ready, clear } = useWardContext()
const { openReceipt, openRti } = useWardModals()
watchEffect(() => { if (import.meta.client && !ready.value && !localStorage.getItem('wmwmg:pin')) navigateTo('/') })
const { data: flags, refresh: refreshFlags } = await useFetch(() => `/api/flags?ward=${useState<string>('ward-slug').value}`, { default: () => ({ counts: {} as Record<string, number>, recent: [] as any[] }), watch: [useState<string>('ward-slug')] })
const posts = computed(() => flags.value?.recent ?? [])
const cr = (n: number | null) => n == null ? '—' : `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 1 })} cr`
const rs = (n: number) => `₹${n.toLocaleString('en-IN')}`
const pct = (a: number | null, b: number) => a == null ? null : Math.round((a / b) * 100)
const sum3 = (a: (number | null)[]) => a.slice(0, 3).reduce((x, y) => (x ?? 0) + (y ?? 0), 0) as number
const utilClass = (u: number | null) => u == null ? 'purple' : u > 150 ? 'red' : u < 90 ? 'blue' : 'green'

const ctx = computed(() => ward.value.cityContext ?? {})
const latestIdx = computed(() => ward.value.total.ward.actual.map((v: any, i: number) => v == null ? -1 : i).filter((i: number) => i >= 0).pop() ?? 2)
const latestYear = computed(() => ward.value.years[latestIdx.value])
const latestBE = computed(() => ward.value.total.ward.be[latestIdx.value])
const latestActual = computed(() => ward.value.total.ward.actual[latestIdx.value])
const latestUtil = computed(() => pct(latestActual.value, latestBE.value)!)
const maxTotal = computed(() => Math.max(...ward.value.total.ward.be, ...ward.value.total.ward.actual.filter((v: any) => v != null)))
const threeBE = computed(() => sum3(ward.value.total.ward.be))
const threeActual = computed(() => sum3(ward.value.total.ward.actual))
const perResident = computed(() => Math.round((threeActual.value * 1e7) / 3 / ward.value.population2025))
const propertyTax = computed(() => (ward.value.propertyTax?.actual ?? []).reduce((a: number, b: number) => a + b, 0))
const photoCount = (k: string) => posts.value.filter((p: any) => p.service === k && p.photo).length
const compare = (s: any) => {
  const u = Math.round(s.avgUtil * 100), m = s.mumbaiAvgUtil ? Math.round(s.mumbaiAvgUtil * 100) : null
  if (m == null) return u > 110 ? 'Spent more than allotted.' : u < 90 ? 'Money left on the table.' : 'Roughly on budget.'
  if (u > m + 50) return `Far above Mumbai's ${m}%. Ask for the breakdown.`
  if (u > m + 10) return `Above Mumbai's ${m}%.`
  if (u < m - 10) return `Below Mumbai's ${m}%.`
  return `In line with Mumbai's ${m}%.`
}

function pickService(k: string, then: string) { if (then === 'rti') openRti(k); else navigateTo({ path: '/forum', query: { service: k } }) }
function startPetition(k: string) { navigateTo('/petitions') }
useHead({ title: computed(() => `Money · ${ward.value.code} ${ward.value.name}`) })
</script>

<template>
  <div v-if="ward" class="page">
    <WardNav :ward="ward" :pin="pin" active="money" :posts="posts" @change-pin="clear" />
    <main>
<!-- 2. MONEY -->
      <section id="money">
        <div class="section-head"><h2>Okay, show<br>me the money.</h2><p>Actuals are RTI-sourced. Spend is closed two years after allocation, so the latest two years are estimates and are labelled.</p></div>
        <div class="grid">
          <article class="card yellow span7 herostat">
            <span class="pill">{{ latestYear }}</span>
            <div class="money">{{ cr(latestBE) }}</div><div class="vs">was allotted</div>
            <div class="money">{{ cr(latestActual) }}</div><div class="vs">was spent</div>
            <p><strong>Translation:</strong> the spreadsheet did not stay inside the lines.</p>
          </article>
          <article class="card green span5 utilcard">
            <div>
              <span class="pill">Utilisation</span>
              <div class="percent">{{ latestUtil }}%</div>
              <div class="meter"><div :style="{ width: Math.min(100, latestUtil) + '%' }"></div></div>
            </div>
            <p><strong>Above 100% does not automatically mean fraud.</strong> It can include spending booked to the ward by central departments. It does mean the number deserves an explanation.</p>
          </article>
          <article class="card span4 stat"><div class="n">{{ Math.round(threeActual / threeBE * 100) }}%</div><div class="l">of budget used over three years<br>{{ cr(threeActual) }} against {{ cr(threeBE) }}</div></article>
          <article class="card span4 stat"><div class="n">{{ rs(perResident) }}</div><div class="l">spent per resident per year<br>Mumbai average {{ rs(ward.total.mumbai.perCapita) }}</div></article>
          <article class="card span4 stat"><div class="n">{{ cr(propertyTax) }}</div><div class="l">property tax collected here in three years<br>vs {{ cr(sum3(ward.revenue.ward.actual)) }} spent running the ward</div></article>
          <article class="card span12">
            <h3 class="h-sm">Allotted vs spent, year by year</h3>
            <div class="years">
              <div v-for="(y, i) in ward.years" :key="y" class="year-row">
                <div class="yr">{{ y }}</div>
                <div><small>Allotted {{ cr(ward.total.ward.be[i]) }}</small><div class="bar"><div :style="{ width: (ward.total.ward.be[i] / maxTotal * 100) + '%' }"></div></div></div>
                <div><small>{{ ward.total.ward.actual[i] == null ? 'Spent: not closed yet' : 'Spent ' + cr(ward.total.ward.actual[i]) }}</small><div class="bar spent" :class="{ est: ward.total.ward.actual[i] == null }"><div :style="{ width: (ward.total.ward.actual[i] == null ? 0 : ward.total.ward.actual[i]! / maxTotal * 100) + '%' }"></div></div></div>
                <div><span class="pill" :class="ward.total.ward.actual[i] == null ? 'purple' : utilClass(pct(ward.total.ward.actual[i], ward.total.ward.be[i]))">{{ ward.total.ward.actual[i] == null ? 'Estimate' : pct(ward.total.ward.actual[i], ward.total.ward.be[i]) + '% · actual' }}</span></div>
              </div>
            </div>
            <p class="mini">{{ ward.note }}</p>
          </article>
        </div>
      </section>

      <!-- 3. SERVICES -->
      <section id="services">
        <div class="section-head"><h2>Where it<br>went.</h2><p>Six services residents actually feel. Three-year average, 2021-22 to 2023-24. Tap a card to ask: "I paid for this. Where is it?"</p></div>
        <div class="services">
          <article v-for="(s, i) in ward.services" :key="s.key" class="card service" :class="{ over: s.avgUtil > 1.5 }">
            <div>
              <div class="svc-top"><span class="pill">{{ s.icon }} {{ s.label }}</span><span v-if="flags?.counts?.[s.key]" class="pill ink">🚩 {{ flags.counts[s.key] }}</span></div>
              <h3>{{ s.label }}</h3>
              <div class="pct">{{ Math.round(s.avgUtil * 100) }}%</div>
              <p><strong>{{ compare(s) }}</strong></p>
            </div>
            <div>
              <div class="numbers">Allotted {{ cr(sum3(s.be)) }} · Spent {{ cr(sum3(s.actual)) }}<br>{{ rs(s.perCapita) }} per resident per year<span v-if="s.fact"> · {{ s.fact }}</span></div>
              <div v-if="flags?.counts?.[s.key]" class="contrast">{{ cr(sum3(s.actual)) }} spent. {{ flags.counts[s.key] }} resident{{ flags.counts[s.key] === 1 ? '' : 's' }} say they don't see it<span v-if="photoCount(s.key)">, with {{ photoCount(s.key) }} photo{{ photoCount(s.key) === 1 ? '' : 's' }}</span>.</div>
              <div class="svc-actions">
                <NuxtLink class="btn flag grow" :to="{ path: '/forum', query: { service: s.key } }">💬 Go to forum →</NuxtLink>
                <button class="btn sm act" @click="pickService(s.key, 'rti')">Ask BMC</button>
                <button class="btn sm" @click="openReceipt(s.key)">Make public</button>
              </div>
            </div>
          </article>
        </div>
      </section>

      <!-- RECEIPTS -->
      <section id="receipts">
        <div class="section-head"><h2>Every number<br>we have.</h2><p>No "trust us". Source, year, and whether a number is actual, estimate or unavailable.</p></div>
        <div class="grid">
          <article class="card span12">
            <details class="alltable">
              <summary class="btn">Show every number we have ▾</summary>
            <div class="tablewrap">
              <table>
                <thead>
                  <tr><th></th><th v-for="y in ward.years" :key="y" colspan="2">{{ y }}</th><th>Per resident / yr</th></tr>
                  <tr class="sub-h"><th></th><template v-for="y in ward.years" :key="y + 'h'"><th>Allotted</th><th>Spent</th></template><th></th></tr>
                </thead>
                <tbody>
                  <tr v-for="r in [{ label: 'Total ward budget', ...ward.total.ward }, { label: 'Day-to-day running (revenue)', ...ward.revenue.ward }, { label: 'New works (capital)', ...ward.capital.ward }, ...ward.services.map(s => ({ label: `${s.icon} ${s.label}`, be: s.be, actual: s.actual, perCapita: s.perCapita })), { label: 'Slum improvement (allotted only)', be: ward.slumImprovement.be, actual: [null, null, null, null, null] as (number|null)[] }]" :key="r.label">
                    <th>{{ r.label }}</th>
                    <template v-for="(y, i) in ward.years" :key="y + r.label">
                      <td>{{ r.be[i] == null ? '—' : r.be[i] }}</td>
                      <td :class="r.actual[i] == null ? 'est' : utilClass(pct(r.actual[i], r.be[i]!))">{{ r.actual[i] == null ? (i >= 3 ? 'est.' : '—') : r.actual[i] }}</td>
                    </template>
                    <td>{{ 'perCapita' in r && r.perCapita ? rs(r.perCapita as number) : '—' }}</td>
                  </tr>
                  <tr class="sep"><th colspan="12">Mumbai, all wards</th></tr>
                  <tr>
                    <th>Total ward budgets</th>
                    <template v-for="(y, i) in ward.years" :key="y + 'm'"><td>{{ ward.total.mumbai.be[i].toLocaleString('en-IN') }}</td><td :class="ward.total.mumbai.actual[i] == null ? 'est' : utilClass(pct(ward.total.mumbai.actual[i], ward.total.mumbai.be[i]))">{{ ward.total.mumbai.actual[i] == null ? 'est.' : ward.total.mumbai.actual[i]!.toLocaleString('en-IN') }}</td></template>
                    <td>{{ rs(ward.total.mumbai.perCapita) }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p class="mini">₹ crore. <span class="pill red">Red</span> spent over 150% of allotment · <span class="pill blue">Blue</span> under 90% · <span class="pill green">Green</span> within range · <span class="pill purple">est.</span> not closed yet.</p>
            </details>
          </article>
          <div class="span7 sources">
            <a v-for="s in ward.sources" :key="s.url" class="source" :href="s.url" target="_blank" rel="noopener">{{ s.name }}<small>{{ s.url.replace(/^https?:\/\//, '').split('/')[0] }}</small></a>
          </div>
          <article class="card red span5">
            <span class="pill">What the BMC does not publish</span>
            <h3 class="h-sm">The missing columns matter too.</h3>
            <ul><li v-for="n in ctx.notPublished" :key="n">{{ n }}</li><li>Ward-level actuals for the last two years</li></ul>
            <p><strong>We cannot conclude what the dataset does not show.</strong> That is exactly what the RTI asks for.</p>
          </article>
        </div>
      </section>

      
    </main>
    <WardModals :ward="ward" :posts="posts" />
    <footer>
      <div class="logo">Somehow We <b>Manage</b></div>
      <div class="disclaimer"><strong>CREATE 2026 prototype · 11 September 2026.</strong> Ward actuals are not published by the BMC; Praja Foundation obtained them under the Right to Information Act. Utilisation above 100% means recorded spend exceeded the allotment.</div>
    </footer>
  </div>
</template>

<style scoped>

.ticker { background: var(--ink); color: var(--white); white-space: nowrap; overflow: hidden; border-bottom: 3px solid var(--ink); }
.track { display: inline-block; padding: 10px 0; animation: ticker 28s linear infinite; font-weight: 900; font-size: 13px; }
.track span span { margin-right: 38px; }
@keyframes ticker { to { transform: translateX(-50%); } }
nav { position: sticky; top: 0; z-index: 30; display: flex; align-items: center; justify-content: space-between; gap: 16px; padding: 12px max(5vw, calc((100vw - 1440px) / 2)); background: rgba(246,244,241,.94); backdrop-filter: blur(10px); border-bottom: 2px solid var(--ink); }
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
.mini { font-size: 12px; font-weight: 700; color: var(--muted); }
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
.tile { display: grid; gap: 4px; border: 2px solid var(--ink); border-radius: 16px; padding: 14px; text-decoration: none; color: var(--ink); box-shadow: 5px 5px 0 rgba(255,255,255,.9); transition: transform 120ms, box-shadow 120ms; }
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
.pt { font-size: 12px; font-weight: 700; color: var(--muted); }
.mlas { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 10px; margin-top: 14px; }
.mla { display: grid; gap: 6px; border: 2px solid var(--ink); border-radius: 14px; padding: 12px; background: var(--white); align-content: start; }
.mla .btn { justify-self: start; }
.herostat .money { font-family: var(--display); font-size: clamp(48px, 7vw, 100px); line-height: .86; letter-spacing: -.06em; }
.herostat .vs { font-size: 22px; font-weight: 900; margin: 10px 0 18px; }
.herostat p { font-size: 18px; font-weight: 700; margin: 0; }
.utilcard { display: flex; flex-direction: column; justify-content: space-between; }
.utilcard .percent { font-family: var(--display); font-size: clamp(72px, 9vw, 140px); line-height: .8; letter-spacing: -.08em; margin: 12px 0; }
.meter { height: 26px; border: 2px solid var(--ink); background: var(--white); border-radius: 999px; overflow: hidden; }
.meter > div { height: 100%; background: var(--coral); border-right: 2px solid var(--ink); transition: width 600ms ease; }
.utilcard p { font-weight: 700; margin: 12px 0 0; }
.stat .n { font-family: var(--display); font-size: clamp(36px, 4vw, 56px); letter-spacing: -.05em; line-height: 1; }
.stat .l { font-weight: 700; font-size: 14px; margin-top: 8px; line-height: 1.35; }
.years { display: grid; }
.year-row { display: grid; grid-template-columns: 84px 1fr 1fr 150px; gap: 12px; align-items: center; padding: 14px 0; border-top: 2px dashed var(--ink); font-weight: 800; }
.year-row small { font-weight: 800; font-size: 12px; }
.bar { height: 18px; border: 2px solid var(--ink); border-radius: 999px; background: var(--white); overflow: hidden; margin-top: 4px; }
.bar > div { height: 100%; background: var(--stone); transition: width 600ms ease; }
.bar.spent > div { background: var(--ink); }
.bar.est { background: repeating-linear-gradient(45deg, #ede7d4, #ede7d4 4px, #fff 4px, #fff 8px); }
.services { display: grid; grid-template-columns: repeat(3, 1fr); gap: 18px; }
.service { min-height: 320px; display: flex; flex-direction: column; justify-content: space-between; gap: 14px; }
.svc-top { display: flex; justify-content: space-between; gap: 8px; }
.service h3 { font-size: 32px; }
.service .pct { font-family: var(--display); font-size: 62px; letter-spacing: -.06em; line-height: 1; }
.service.over .pct { color: var(--coral); }
.service .contrast { background: var(--stone); }
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
.meme.red { background: var(--red); } .meme.blue { background: var(--blue); } .meme.yellow { background: var(--yellow); } .tablewrap { overflow-x: auto; }
table { border-collapse: collapse; font-size: 13px; min-width: 820px; width: 100%; font-weight: 700; }
th, td { padding: 8px 8px; text-align: right; border-bottom: 2px dashed #c9c2ad; white-space: nowrap; }
thead th { text-align: center; border-bottom: 3px solid var(--ink); }
.sub-h th { font-size: 11px; text-transform: uppercase; letter-spacing: .05em; border-bottom: 2px solid var(--ink); }
tbody th { text-align: left; position: sticky; left: 0; background: var(--surface); }
td.red { color: var(--coral); font-weight: 900; } td.blue { color: var(--muted); font-weight: 800; } td.green { color: var(--ink); font-weight: 800; } td.est { color: var(--muted); font-style: italic; }
tr.sep th { padding-top: 16px; text-transform: uppercase; font-size: 11px; letter-spacing: .06em; }
.sources { display: grid; gap: 12px; align-content: start; }
.source { border: 2px solid var(--ink); border-radius: 16px; background: var(--white); padding: 14px 16px; font-weight: 800; text-decoration: none; display: block; }
.source small { display: block; color: var(--muted); margin-top: 4px; font-weight: 600; }
.card.red ul { font-weight: 800; line-height: 1.6; padding-left: 20px; }
.close { background: var(--yellow); text-align: center; }
.close h2 { font-size: clamp(52px, 8vw, 116px); line-height: .85; letter-spacing: -.07em; text-transform: uppercase; }
.close p { font-size: 20px; font-weight: 700; max-width: 800px; margin: 24px auto; }
footer { padding: 34px max(6vw, calc((100vw - 1440px) / 2)) 50px; font-weight: 700; }
.disclaimer { background: var(--white); border: 2px dashed var(--ink); padding: 14px; border-radius: 12px; margin-top: 14px; font-size: 14px; }
.pinkbtn { background: var(--pink); }
.herocard.live { display: grid; gap: 10px; text-decoration: none; color: var(--ink); padding: 18px; }
.live-top { display: flex; justify-content: space-between; gap: 8px; flex-wrap: wrap; }
.herocard.live img { width: 100%; height: 220px; object-fit: cover; border: 2px solid var(--ink); border-radius: 14px; display: block; }
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
.modal-card { background: var(--paper); border: 2px solid var(--ink); border-radius: 22px; padding: 22px; max-width: 760px; width: 100%; box-shadow: 10px 10px 0 var(--yellow); max-height: 92vh; overflow: auto; display: grid; gap: 14px; }
.modal-top { display: flex; justify-content: space-between; gap: 16px; align-items: start; }
.modal-top h3 { font-size: 36px; margin: 8px 0 4px; }
.x { border: 2px solid var(--ink); background: var(--white); border-radius: 10px; padding: 6px 10px; font-weight: 900; cursor: pointer; }
.confetti { position: fixed; inset: 0; pointer-events: none; z-index: 100; }
.piece { position: absolute; width: 10px; height: 18px; top: -30px; animation: fall 1.8s linear forwards; }
@keyframes fall { to { transform: translateY(110vh) rotate(720deg); } }
.toast { position: fixed; bottom: 18px; left: 50%; transform: translateX(-50%); background: var(--ink); color: var(--white); border-radius: 999px; padding: 10px 16px; font-weight: 800; z-index: 120; }
@media (max-width: 920px) {
  nav .links { display: none; }
  .hero { grid-template-columns: 1fr; padding-top: 40px; }
  .herocard { transform: none; }
  .span4, .span5, .span7 { grid-column: span 12; }
  .services,   .year-row { grid-template-columns: 64px 1fr; }
  .year-row > div:nth-child(3), .year-row > div:nth-child(4) { grid-column: 2; }
  .section-head { align-items: start; flex-direction: column; }
  section { padding: 48px 20px; }
}

.page { background: var(--paper); min-height: 100vh; }
main { display: block; }

</style>
