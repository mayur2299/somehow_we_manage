<script setup lang="ts">
import ward from '~/data/k-east.json'

const cr = (n: number | null) => n == null ? '—' : `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 1 })} cr`
const pct = (a: number | null, b: number) => a == null ? null : Math.round((a / b) * 100)
const rs = (n: number) => `₹${n.toLocaleString('en-IN')}`

// Latest year with actuals
const latestIdx = ward.total.ward.actual.map((v, i) => v == null ? -1 : i).filter(i => i >= 0).pop()!
const latestYear = ward.years[latestIdx]
const latestBE = ward.total.ward.be[latestIdx]
const latestActual = ward.total.ward.actual[latestIdx]!
const latestUtil = pct(latestActual, latestBE)!

const maxTotal = Math.max(...ward.total.ward.be, ...ward.total.ward.actual.filter((v): v is number => v != null))
const bar = (v: number | null, max: number) => v == null ? 0 : Math.max(2, (v / max) * 100)

const utilClass = (u: number | null) => u == null ? '' : u > 150 ? 'over' : u < 90 ? 'under' : 'ok'
const utilWord = (u: number | null) => u == null ? 'estimate only' : u > 150 ? 'heavily overspent' : u > 105 ? 'overspent' : u < 90 ? 'underspent' : 'on budget'

const selected = ref(ward.services[0].key)
const svc = computed(() => ward.services.find(s => s.key === selected.value)!)
const svcMax = computed(() => Math.max(...svc.value.be, ...svc.value.actual.filter((v): v is number => v != null)))

const threeYearBE = ward.total.ward.be.slice(0, 3).reduce((a, b) => a + b, 0)
const threeYearActual = ward.total.ward.actual.slice(0, 3).reduce((a, b) => a! + b!, 0)!
const threeYearUtil = Math.round((threeYearActual / threeYearBE) * 100)
const perResidentActual = Math.round((threeYearActual * 1e7) / 3 / ward.population2025)
const propertyTaxTotal = ward.propertyTax.actual.reduce((a, b) => a + b, 0)
const revenueActualTotal = ward.revenue.ward.actual.slice(0, 3).reduce((a, b) => a! + b!, 0)!

// Every figure from the report, year by year
type Row = { label: string; be: (number | null)[]; actual: (number | null)[]; perCapita?: number; extra?: string }
const allRows: Row[] = [
  { label: 'Total ward budget', ...ward.total.ward },
  { label: 'Day-to-day running (revenue)', ...ward.revenue.ward },
  { label: 'New works (capital)', ...ward.capital.ward },
  ...ward.services.map(s => ({ label: `${s.icon} ${s.label}`, be: s.be, actual: s.actual, perCapita: s.perCapita, extra: s.fact })),
  { label: 'Slum improvement (allotted only)', be: ward.slumImprovement.be, actual: [null, null, null, null, null] },
  { label: 'Property tax collected here', be: [null, null, null, null, null], actual: [...ward.propertyTax.actual, null, null], perCapita: ward.propertyTax.perCapita },
]
const mumbaiRows: Row[] = [
  { label: 'Mumbai total, all wards', ...ward.total.mumbai },
  { label: 'Mumbai new works (capital)', ...ward.capital.mumbai },
]
const fmt = (n: number | null) => n == null ? '—' : n.toLocaleString('en-IN', { maximumFractionDigits: 1 })

const panel = ref<'none' | 'flag' | 'rti'>('none')
const wardSlug = 'k-east'
const { data: flags, refresh: refreshFlags } = await useFetch(`/api/flags?ward=${wardSlug}`, { default: () => ({ counts: {}, recent: [] as any[] }) })
const svcFlags = computed(() => (flags.value?.recent ?? []).filter((f: any) => f.service === selected.value))
watch(selected, () => (panel.value = 'none'))
const ctx = ward.cityContext
</script>

<template>
  <main class="page">
    <header class="hero">
      <p class="eyebrow">Where my ward's money goes</p>
      <h1>{{ ward.code }} · {{ ward.name }}</h1>
      <p class="areas">{{ ward.areas }}</p>
      <p class="pop">{{ ward.population2025.toLocaleString('en-IN') }} residents · {{ Math.round(ward.slumShare * 100) }}% live in slums</p>
    </header>

    <section class="hook">
      <p>Across Mumbai, the share of the BMC budget that reaches wards fell from <strong>{{ ctx.wardShare2021 }}%</strong> to <strong>{{ ctx.wardShare2025 }}%</strong> between 2021-22 and 2025-26, while the total budget nearly doubled from ₹{{ ctx.bmcBudget2021.toLocaleString('en-IN') }} cr to ₹{{ ctx.bmcBudget2025.toLocaleString('en-IN') }} cr. This page follows one ward's share.</p>
    </section>

    <section class="headline">
      <p class="big">
        In {{ latestYear }} this ward was given <strong>{{ cr(latestBE) }}</strong>
        and spent <strong>{{ cr(latestActual) }}</strong>.
      </p>
      <p class="util" :class="utilClass(latestUtil)">{{ latestUtil }}% of budget used · {{ utilWord(latestUtil) }}</p>
    </section>

    <section class="card">
      <h2>Allotted vs actually spent</h2>
      <p class="sub">Total ward budget, ₹ crore</p>
      <div class="chart">
        <div v-for="(y, i) in ward.years" :key="y" class="col">
          <div class="bars">
            <div class="b be" :style="{ height: bar(ward.total.ward.be[i], maxTotal) + '%' }" :title="'Allotted ' + cr(ward.total.ward.be[i])"><span>{{ ward.total.ward.be[i] }}</span></div>
            <div class="b ac" :class="{ none: ward.total.ward.actual[i] == null }" :style="{ height: bar(ward.total.ward.actual[i], maxTotal) + '%' }" :title="'Spent ' + cr(ward.total.ward.actual[i])"><span>{{ ward.total.ward.actual[i] ?? '?' }}</span></div>
          </div>
          <div class="yr">{{ y }}</div>
          <div class="u" :class="utilClass(pct(ward.total.ward.actual[i], ward.total.ward.be[i]))">
            {{ pct(ward.total.ward.actual[i], ward.total.ward.be[i]) != null ? pct(ward.total.ward.actual[i], ward.total.ward.be[i]) + '%' : 'estimate' }}
          </div>
        </div>
      </div>
      <div class="legend"><span class="sw be"></span> Allotted <span class="sw ac"></span> Spent</div>
      <p class="note">{{ ward.note }}</p>
    </section>

    <section class="stats">
      <div class="stat">
        <div class="n">{{ threeYearUtil }}%</div>
        <div class="l">of budget used over three years<br>{{ cr(threeYearActual) }} spent against {{ cr(threeYearBE) }}</div>
      </div>
      <div class="stat">
        <div class="n">{{ rs(perResidentActual) }}</div>
        <div class="l">spent per resident per year<br>Mumbai average {{ rs(ward.total.mumbai.perCapita) }}</div>
      </div>
      <div class="stat">
        <div class="n">{{ cr(propertyTaxTotal) }}</div>
        <div class="l">property tax collected here in three years<br>vs {{ cr(revenueActualTotal) }} spent on running the ward</div>
      </div>
    </section>

    <section class="card">
      <h2>Where it went</h2>
      <p class="sub">Tap a service. Average use of budget, 2021-22 to 2023-24.</p>
      <div class="chips">
        <button v-for="s in ward.services" :key="s.key" class="chip" :class="[{ on: s.key === selected }, utilClass(Math.round(s.avgUtil * 100))]" @click="selected = s.key">
          <span class="ic">{{ s.icon }}</span> {{ s.label }} <b>{{ Math.round(s.avgUtil * 100) }}%</b>
          <span v-if="flags?.counts?.[s.key]" class="cnt" :title="flags.counts[s.key] + ' resident flags'">🚩{{ flags.counts[s.key] }}</span>
        </button>
      </div>

      <div class="svc">
        <h3>{{ svc.icon }} {{ svc.label }}</h3>
        <p class="sent">
          Over three years, {{ svc.label.toLowerCase() }} was allotted
          <strong>{{ cr(svc.be.slice(0,3).reduce((a,b)=>a+b,0)) }}</strong> and actually used
          <strong>{{ cr(svc.actual.slice(0,3).reduce((a,b)=>a!+b!,0)!) }}</strong>,
          <span :class="utilClass(Math.round(svc.avgUtil*100))">{{ Math.round(svc.avgUtil * 100) }}% of budget</span>.
          <template v-if="svc.mumbaiAvgUtil">Mumbai as a whole used {{ Math.round(svc.mumbaiAvgUtil * 100) }}%.</template>
        </p>
        <div class="chart small">
          <div v-for="(y, i) in ward.years" :key="y" class="col">
            <div class="bars">
              <div class="b be" :style="{ height: bar(svc.be[i], svcMax) + '%' }"><span>{{ svc.be[i] }}</span></div>
              <div class="b ac" :class="{ none: svc.actual[i] == null }" :style="{ height: bar(svc.actual[i], svcMax) + '%' }"><span>{{ svc.actual[i] ?? '?' }}</span></div>
            </div>
            <div class="yr">{{ y.slice(0, 4) }}</div>
          </div>
        </div>
        <p class="meta">{{ rs(svc.perCapita) }} per resident per year<span v-if="svc.fact"> · {{ svc.fact }}</span></p>

        <div class="actions">
          <button class="act" :class="{ on: panel === 'flag' }" @click="panel = panel === 'flag' ? 'none' : 'flag'">🚩 I don't see this on the ground</button>
          <button class="act" :class="{ on: panel === 'rti' }" @click="panel = panel === 'rti' ? 'none' : 'rti'">📄 Ask the BMC (RTI)</button>
        </div>
        <FlagIssue v-if="panel === 'flag'" :ward-slug="wardSlug" :service-key="svc.key" :service-label="svc.label" @flagged="refreshFlags()" />
        <RtiDraft v-if="panel === 'rti'" :ward-code="ward.code" :ward-name="ward.name" :service="svc" :years="ward.years" />

        <div v-if="svcFlags.length" class="flags">
          <p class="flags-h">{{ svcFlags.length }} resident {{ svcFlags.length === 1 ? 'flag' : 'flags' }} on {{ svc.label.toLowerCase() }}</p>
          <div v-for="f in svcFlags" :key="f.id" class="fl">
            <img v-if="f.photo" :src="f.photo" alt="" />
            <div>
              <p class="fl-note">{{ f.note || 'Photo only' }}</p>
              <p class="fl-ts">{{ new Date(f.ts).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) }}</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="card">
      <h2>Every number we have for {{ ward.code }}</h2>
      <p class="sub">₹ crore. Allotted = budget estimate. Spent = actual expenditure. Blank means not yet published.</p>
      <div class="tablewrap">
        <table>
          <thead>
            <tr>
              <th></th>
              <th v-for="y in ward.years" :key="y" colspan="2">{{ y }}</th>
              <th>Per resident<br>per year</th>
            </tr>
            <tr class="sub-h">
              <th></th>
              <template v-for="y in ward.years" :key="y + 'h'"><th>Allotted</th><th>Spent</th></template>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="r in allRows" :key="r.label">
              <th>{{ r.label }}<small v-if="r.extra"> · {{ r.extra }}</small></th>
              <template v-for="(y, i) in ward.years" :key="y + r.label">
                <td>{{ fmt(r.be[i]) }}</td>
                <td :class="utilClass(r.be[i] && r.actual[i] != null ? pct(r.actual[i], r.be[i]!) : null)">{{ fmt(r.actual[i]) }}</td>
              </template>
              <td>{{ r.perCapita ? rs(r.perCapita) : '—' }}</td>
            </tr>
            <tr class="sep"><th colspan="12">For comparison</th></tr>
            <tr v-for="r in mumbaiRows" :key="r.label">
              <th>{{ r.label }}</th>
              <template v-for="(y, i) in ward.years" :key="y + r.label">
                <td>{{ fmt(r.be[i]) }}</td>
                <td :class="utilClass(r.be[i] && r.actual[i] != null ? pct(r.actual[i], r.be[i]!) : null)">{{ fmt(r.actual[i]) }}</td>
              </template>
              <td>{{ r.perCapita ? rs(r.perCapita) : '—' }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p class="note">Spent figures shown in <span class="over">orange</span> exceeded the allotment by more than half, <span class="under">blue</span> fell short of 90%, <span class="ok">green</span> is within range.</p>
    </section>

    <section class="card dark">
      <h2>What the BMC does not publish</h2>
      <ul class="np">
        <li v-for="n in ctx.notPublished" :key="n">{{ n }}</li>
      </ul>
      <p class="ex">{{ ctx.penaltyExample.text }} <a :href="ctx.penaltyExample.url" target="_blank" rel="noopener">{{ ctx.penaltyExample.source }}</a></p>
      <p class="ex">That is why every service above has an "Ask the BMC" button: the Right to Information Act obliges the ward office to answer within 30 days.</p>
    </section>

    <section class="card">
      <h2>Money for slum improvement is shrinking</h2>
      <p class="sub">Allotted, ₹ crore. {{ ward.slumPopulation.toLocaleString('en-IN') }} people in this ward live in slums.</p>
      <div class="chart small">
        <div v-for="(y, i) in ward.years" :key="y" class="col">
          <div class="bars">
            <div class="b slum" :style="{ height: bar(ward.slumImprovement.be[i], Math.max(...ward.slumImprovement.be)) + '%' }"><span>{{ ward.slumImprovement.be[i] }}</span></div>
          </div>
          <div class="yr">{{ y.slice(0, 4) }}</div>
        </div>
      </div>
      <p class="sent">Down <strong>{{ Math.abs(ward.slumImprovement.changePct) }}%</strong> since 2021-22.</p>
    </section>

    <footer>
      <p>Sources</p>
      <ul>
        <li v-for="s in ward.sources" :key="s.url"><a :href="s.url" target="_blank" rel="noopener">{{ s.name }}</a></li>
      </ul>
      <p class="fine">Ward actuals are not published by the BMC. Praja Foundation obtained them under the Right to Information Act. Figures in ₹ crore. Utilisation above 100% means the ward spent more than it was allotted.</p>
    </footer>
  </main>
</template>

<style scoped>
.page { max-width: 720px; margin: 0 auto; padding: 1.25rem 1rem 3rem; font-family: system-ui, -apple-system, sans-serif; color: #1a1a1a; }
.hero { padding: 0.5rem 0 1rem; }
.eyebrow { text-transform: uppercase; letter-spacing: 0.08em; font-size: 0.75rem; color: #666; margin: 0 0 0.25rem; }
h1 { font-size: 2rem; margin: 0; line-height: 1.1; }
.areas { color: #555; margin: 0.35rem 0 0; }
.pop { color: #555; margin: 0.15rem 0 0; font-size: 0.95rem; }
.headline { background: #111; color: #fff; border-radius: 14px; padding: 1.25rem 1.25rem; margin: 0.75rem 0 1rem; }
.big { font-size: 1.35rem; line-height: 1.35; margin: 0; }
.big strong { color: #ffd166; }
.util { margin: 0.6rem 0 0; font-weight: 600; }
.util.over { color: #ff6b6b; } .util.under { color: #74c0fc; } .util.ok { color: #8ce99a; }
.card { background: #fff; border: 1px solid #e6e6e6; border-radius: 14px; padding: 1.1rem 1.1rem 1rem; margin: 0 0 1rem; }
h2 { font-size: 1.15rem; margin: 0 0 0.15rem; }
.sub { margin: 0 0 0.9rem; color: #666; font-size: 0.9rem; }
.chart { display: flex; gap: 0.5rem; height: 200px; align-items: stretch; padding-top: 1.25rem; }
.chart.small { height: 130px; }
.col { flex: 1; display: flex; flex-direction: column; min-width: 0; }
.bars { flex: 1; display: flex; gap: 3px; align-items: flex-end; justify-content: center; }
.b { width: 42%; border-radius: 4px 4px 0 0; position: relative; transition: height 0.4s ease; }
.b span { position: absolute; top: -1.15rem; left: 0; right: 0; text-align: center; font-size: 0.7rem; color: #444; }
.b.be { background: #c9d6ff; }
.b.ac { background: #3b5bdb; }
.b.ac.none { background: repeating-linear-gradient(45deg, #eee, #eee 4px, #f8f8f8 4px, #f8f8f8 8px); min-height: 2%; }
.b.ac.none span { color: #999; }
.b.slum { background: #e8590c; width: 60%; }
.yr { text-align: center; font-size: 0.72rem; color: #555; margin-top: 0.35rem; }
.u { text-align: center; font-size: 0.75rem; font-weight: 700; margin-top: 0.1rem; color: #888; }
.u.over { color: #d9480f; } .u.under { color: #1971c2; } .u.ok { color: #2b8a3e; }
.legend { display: flex; gap: 0.5rem; align-items: center; font-size: 0.8rem; color: #555; margin-top: 0.75rem; }
.sw { display: inline-block; width: 12px; height: 12px; border-radius: 3px; margin-left: 0.5rem; }
.sw.be { background: #c9d6ff; } .sw.ac { background: #3b5bdb; }
.note { font-size: 0.8rem; color: #777; margin: 0.6rem 0 0; }
.stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.75rem; margin: 0 0 1rem; }
.stat { background: #f6f7fb; border-radius: 12px; padding: 0.9rem 0.85rem; }
.stat .n { font-size: 1.5rem; font-weight: 800; letter-spacing: -0.02em; }
.stat .l { font-size: 0.78rem; color: #555; line-height: 1.35; margin-top: 0.2rem; }
.chips { display: flex; flex-wrap: wrap; gap: 0.45rem; margin-bottom: 1rem; }
.chip { border: 1px solid #ddd; background: #fafafa; border-radius: 999px; padding: 0.4rem 0.75rem; font-size: 0.85rem; cursor: pointer; display: inline-flex; align-items: center; gap: 0.35rem; }
.chip b { font-weight: 700; }
.chip.over b { color: #d9480f; } .chip.under b { color: #1971c2; } .chip.ok b { color: #2b8a3e; }
.chip.on { background: #111; color: #fff; border-color: #111; }
.chip.on b { color: #ffd166; }
.svc h3 { margin: 0 0 0.4rem; font-size: 1.05rem; }
.sent { line-height: 1.5; margin: 0 0 0.9rem; }
.sent .over { color: #d9480f; font-weight: 700; } .sent .under { color: #1971c2; font-weight: 700; } .sent .ok { color: #2b8a3e; font-weight: 700; }
.meta { font-size: 0.85rem; color: #555; margin: 0.75rem 0 0; }
footer { color: #666; font-size: 0.85rem; margin-top: 1.5rem; }
footer ul { padding-left: 1.1rem; margin: 0.25rem 0 0.75rem; }
footer a { color: #3b5bdb; }
.fine { font-size: 0.78rem; line-height: 1.45; }
.hook { background: #eef1ff; border-left: 4px solid #3b5bdb; border-radius: 10px; padding: 0.8rem 1rem; margin: 0.25rem 0 0.9rem; font-size: 0.95rem; line-height: 1.45; }
.hook p { margin: 0; }
.cnt { margin-left: 0.25rem; font-size: 0.75rem; }
.actions { display: flex; flex-wrap: wrap; gap: 0.5rem; margin-top: 0.9rem; }
.act { border: 1px solid #ccc; background: #fff; border-radius: 10px; padding: 0.55rem 0.9rem; cursor: pointer; font: inherit; font-size: 0.9rem; }
.act.on { background: #111; color: #fff; border-color: #111; }
.flags { margin-top: 0.9rem; }
.flags-h { font-weight: 600; margin: 0 0 0.5rem; font-size: 0.9rem; }
.fl { display: flex; gap: 0.6rem; align-items: flex-start; padding: 0.5rem 0; border-top: 1px solid #eee; }
.fl img { width: 72px; height: 72px; object-fit: cover; border-radius: 8px; flex: none; }
.fl-note { margin: 0; font-size: 0.9rem; }
.fl-ts { margin: 0.15rem 0 0; font-size: 0.75rem; color: #888; }
.tablewrap { overflow-x: auto; -webkit-overflow-scrolling: touch; }
table { border-collapse: collapse; font-size: 0.8rem; min-width: 760px; width: 100%; }
th, td { padding: 0.4rem 0.45rem; text-align: right; border-bottom: 1px solid #eee; white-space: nowrap; }
thead th { font-weight: 600; color: #444; text-align: center; border-bottom: 2px solid #ddd; }
thead .sub-h th { font-weight: 500; font-size: 0.72rem; color: #777; border-bottom: 1px solid #ddd; }
tbody th { text-align: left; font-weight: 600; position: sticky; left: 0; background: #fff; }
tbody th small { display: block; font-weight: 400; color: #888; font-size: 0.7rem; }
tbody td.over { color: #d9480f; font-weight: 700; } tbody td.under { color: #1971c2; font-weight: 700; } tbody td.ok { color: #2b8a3e; font-weight: 700; }
tr.sep th { text-align: left; color: #666; font-weight: 600; padding-top: 0.8rem; background: #fff; }
.note .over { color: #d9480f; font-weight: 700; } .note .under { color: #1971c2; font-weight: 700; } .note .ok { color: #2b8a3e; font-weight: 700; }
.card.dark { background: #111; color: #eee; border-color: #111; }
.card.dark h2 { color: #fff; }
.np { padding-left: 1.1rem; margin: 0.5rem 0 0.75rem; line-height: 1.5; }
.ex { margin: 0.5rem 0 0; line-height: 1.5; font-size: 0.92rem; }
.ex a { color: #ffd166; }
@media (max-width: 520px) {
  h1 { font-size: 1.6rem; }
  .stats { grid-template-columns: 1fr; }
  .big { font-size: 1.15rem; }
  .chart { height: 170px; }
}
</style>
