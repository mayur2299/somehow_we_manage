<script setup lang="ts">
import ward from '~/data/k-east.json'

// ---------- helpers ----------
const cr = (n: number | null) => n == null ? '—' : `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 1 })} cr`
const rs = (n: number) => `₹${n.toLocaleString('en-IN')}`
const pct = (a: number | null, b: number) => a == null ? null : Math.round((a / b) * 100)
const sum3 = (a: (number | null)[]) => a.slice(0, 3).reduce((x, y) => (x ?? 0) + (y ?? 0), 0) as number
const utilClass = (u: number | null) => u == null ? 'purple' : u > 150 ? 'red' : u < 90 ? 'blue' : 'green'
const utilWord = (u: number | null) => u == null ? 'estimate only' : u > 150 ? 'heavily overspent' : u > 105 ? 'overspent' : u < 90 ? 'underspent' : 'on budget'

// ---------- entry / PIN ----------
const entered = ref(false)
const pinInfo = ref<{ pin: string; area: string } | null>(null)
onMounted(() => {
  try {
    const q = new URLSearchParams(location.search).get('pin')
    const saved = localStorage.getItem('wmwmg:pin')
    const pin = q || saved
    if (pin) { const hit = ward.pincodes.find(p => p.pin === pin); if (hit) { pinInfo.value = { pin, area: hit.area }; entered.value = true } }
  } catch {}
})
function onFound(p: { pin: string; area: string }) { pinInfo.value = p; entered.value = true; try { localStorage.setItem('wmwmg:pin', p.pin) } catch {} ; window.scrollTo({ top: 0 }) }
function changePin() { entered.value = false; pinInfo.value = null; try { localStorage.removeItem('wmwmg:pin') } catch {} }

// ---------- headline numbers ----------
const latestIdx = ward.total.ward.actual.map((v, i) => v == null ? -1 : i).filter(i => i >= 0).pop()!
const latestYear = ward.years[latestIdx]
const latestBE = ward.total.ward.be[latestIdx]
const latestActual = ward.total.ward.actual[latestIdx]!
const latestUtil = pct(latestActual, latestBE)!
const maxTotal = Math.max(...ward.total.ward.be, ...ward.total.ward.actual.filter((v): v is number => v != null))
const threeBE = sum3(ward.total.ward.be), threeActual = sum3(ward.total.ward.actual)
const perResident = Math.round((threeActual * 1e7) / 3 / ward.population2025)
const propertyTax = ward.propertyTax.actual.reduce((a, b) => a + b, 0)
const ctx = ward.cityContext
const acc = ward.accountable
const partyTally = Object.entries(acc.corporators.reduce((t: Record<string, number>, c) => { t[c.party] = (t[c.party] ?? 0) + 1; return t }, {})).sort((a, b) => b[1] - a[1])
const affidavit = (name: string) => `https://www.myneta.info/search_myneta.php?q=${encodeURIComponent(name)}`

// ---------- services ----------
const svcColors = ['blue', 'yellow', 'pink', 'green', 'purple', 'orange']
const selected = ref(ward.services[2].key) // drains: the loudest number
const svc = computed(() => ward.services.find(s => s.key === selected.value)!)
const svcLabel = (k: string) => ward.services.find(s => s.key === k)?.label ?? k
const svcIcon = (k: string) => ward.services.find(s => s.key === k)?.icon ?? ''
const compare = (s: typeof ward.services[number]) => {
  const u = Math.round(s.avgUtil * 100), m = s.mumbaiAvgUtil ? Math.round(s.mumbaiAvgUtil * 100) : null
  if (m == null) return u > 110 ? 'Spent more than allotted.' : u < 90 ? 'Money left on the table.' : 'Roughly on budget.'
  if (u > m + 50) return `Far above Mumbai's ${m}%. Ask for the breakdown.`
  if (u > m + 10) return `Above Mumbai's ${m}%.`
  if (u < m - 10) return `Below Mumbai's ${m}%.`
  return `In line with Mumbai's ${m}%.`
}

// ---------- forum (flags) ----------
const wardSlug = 'k-east'
const { data: flags, refresh: refreshFlags } = await useFetch(`/api/flags?ward=${wardSlug}`, { default: () => ({ counts: {} as Record<string, number>, recent: [] as any[] }) })
const posts = computed(() => flags.value?.recent ?? [])
const photoCount = (k: string) => posts.value.filter((f: any) => f.service === k && f.photo).length
const showPostForm = ref(false)
const forumService = ref<string | undefined>()
const confettiOn = ref(false)
function celebrate() { confettiOn.value = true; setTimeout(() => (confettiOn.value = false), 2200) }
const confetti = Array.from({ length: 28 }, (_, i) => ({ left: `${(i * 37) % 100}vw`, delay: `${(i % 7) * 0.05}s`, bg: ['#ffd84d', '#b7ff4a', '#ff88c7', '#85c7ff'][i % 4] }))


// ---------- RTI modal ----------
const rtiOpen = ref(false)
function openRti(k?: string) { if (k) selected.value = k; rtiOpen.value = true }

// petitions
const petitionPreselect = ref<string | undefined>()
const petitionsKey = ref(0)
function startPetition(k: string) { petitionPreselect.value = k; document.querySelector('#petitions')?.scrollIntoView({ behavior: 'smooth' }) }

function go(id: string) { document.querySelector(id)?.scrollIntoView({ behavior: 'smooth' }) }
function pickService(k: string, then: 'forum' | 'rti') {
  selected.value = k
  if (then === 'rti') openRti()
  else { forumService.value = k; showPostForm.value = true; go('#forum') }
}
useHead({ title: `Where My Ward's Money Goes — ${ward.code} ${ward.name}` })
</script>

<template>
  <div>
    <PinGate v-if="!entered" :pincodes="ward.pincodes" :ward-code="ward.code" :ward-name="ward.name" @found="onFound" />

    <div v-else>
      <div class="ticker" aria-hidden="true"><div class="track">
        <span v-for="n in 2" :key="n">
          <span>💸 YOUR WARD GOT ₹{{ latestBE }} CR. IT SPENT ₹{{ latestActual }} CR.</span>
          <span>📄 1,000-PAGE PDF: BECAUSE TRANSPARENCY LOVES A TREASURE HUNT</span>
          <span>🕳️ DRAINS AT {{ Math.round(ward.services[2].avgUtil * 100) }}%: MATH HAS LEFT THE CHAT</span>
          <span>🧾 RECEIPTS &gt; RIBBONS</span>
          <span>🗳️ MARCH 2022 – JAN 2026: NO ELECTED COUNCIL</span>
        </span>
      </div></div>

      <nav>
        <div class="logo">Where My Ward's <b>Money Goes</b></div>
        <div class="links">
          <a href="#reps" @click.prevent="go('#reps')">Who</a>
          <a href="#money" @click.prevent="go('#money')">Money</a>
          <a href="#services" @click.prevent="go('#services')">Where</a>
          <a href="#forum" @click.prevent="go('#forum')">Ground</a>
          <a href="#petitions" @click.prevent="go('#petitions')">Petitions</a>
          <a href="#receipts" @click.prevent="go('#receipts')">Receipts</a>
        </div>
        <button class="btn sm" @click="changePin">← Change PIN</button>
      </nav>

      <!-- HERO -->
      <header class="hero">
        <div>
          <div class="idbar">
            <span class="pill">📍 {{ pinInfo?.pin }}</span>
            <span class="pill yellow">{{ ward.code }} ward</span>
            <span class="pill">{{ pinInfo?.area }}</span>
          </div>
          <h1>Your ward<br>got money.<br>Now what?</h1>
          <p>See what {{ ward.name }} was allotted, what it actually spent, and where it went. Then post what you see on the ground, sign a petition, or send the BMC an RTI with the numbers already filled in.</p>
          <div class="cta-row">
            <button class="btn primary" @click="go('#money')">Show me the money ↓</button>
            <button class="btn" @click="go('#reps')">Who represents me?</button>
          </div>
        </div>
        <div class="card feature pink herocard">
          <span class="pill">Ward share of total BMC budget</span>
          <div class="slash">{{ ctx.wardShare2021 }}% → {{ ctx.wardShare2025 }}%</div>
          <p>The total BMC budget nearly doubled, ₹{{ ctx.bmcBudget2021.toLocaleString('en-IN') }} cr to ₹{{ ctx.bmcBudget2025.toLocaleString('en-IN') }} cr. The share reaching wards fell.</p>
          <small class="mini">Source in the receipts section.</small>
        </div>
      </header>

      <!-- 1. REPRESENTATIVES -->
      <section id="reps">
        <div class="section-head"><h2>Who<br>represents you.</h2><p>Elected {{ acc.electedOn }}. Before that, {{ acc.administratorPeriod.toLowerCase() }}, nobody was.</p></div>
        <div class="grid">
          <article class="card red span7">
            <span class="pill">{{ acc.administratorPeriod }}</span>
            <h3>No elected council for almost four years.</h3>
            <p><strong>{{ acc.administratorNote }}</strong></p>
          </article>
          <article class="card span5">
            <span class="pill">Ward office</span>
            <h3 class="h-sm">{{ acc.wardOffice.title }}</h3>
            <p>{{ acc.wardOffice.address }}<br><strong>{{ acc.wardOffice.phone }}</strong></p>
            <p class="mini">{{ acc.wardOffice.note }}</p>
          </article>
          <article class="card span12">
            <div class="reps-head">
              <div>
                <span class="pill green">Corporators · electoral wards {{ acc.electoralWards }}</span>
                <h3 class="h-sm">{{ acc.corporators.length }} corporators, {{ partyTally.map(([p, n]) => `${n} ${p}`).join(', ') }}.</h3>
              </div>
              <p class="mini">Party shown as text only. Colours on this site mean data, never politics. "Declared" links open the candidate's own election affidavit search on MyNeta, where assets and pending cases are self-declared.</p>
            </div>
            <div class="reps">
              <div v-for="c in acc.corporators" :key="c.ward" class="rep" :class="{ kn: c.nowKNorth }">
                <span class="wn">{{ c.ward }}</span>
                <div class="rep-body">
                  <div class="nm">{{ c.name }}</div>
                  <div class="pt">{{ c.party }} · {{ c.votes.toLocaleString('en-IN') }} votes</div>
                </div>
                <a class="btn sm" :href="affidavit(c.name)" target="_blank" rel="noopener">Declared ↗</a>
              </div>
            </div>
            <p class="mini">{{ acc.kNorthNote }} Dashed cards now report to K/North.</p>
            <hr class="divider" />
            <div class="mlas">
              <div v-for="m in acc.mlas" :key="m.constituency" class="mla">
                <span class="pill">MLA · {{ m.constituency }}</span>
                <div class="nm">{{ m.name }} <span class="pt">· {{ m.party }}</span></div>
                <a class="btn sm" :href="affidavit(m.name)" target="_blank" rel="noopener">Declared ↗</a>
              </div>
              <div class="mla">
                <span class="pill">Mayor of Mumbai</span>
                <div class="nm">{{ acc.mayor.name }} <span class="pt">· {{ acc.mayor.party }}</span></div>
                <a class="btn sm" :href="affidavit(acc.mayor.name)" target="_blank" rel="noopener">Declared ↗</a>
              </div>
            </div>
          </article>
        </div>
      </section>

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
          <article v-for="(s, i) in ward.services" :key="s.key" class="card service" :class="svcColors[i]">
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
                <button class="btn sm flag" @click="pickService(s.key, 'forum')">🚩 I don't see this</button>
                <button class="btn sm act" @click="pickService(s.key, 'rti')">🧾 Ask BMC</button>
                <button class="btn sm" @click="startPetition(s.key)">✍️ Petition</button>
              </div>
            </div>
          </article>
        </div>
      </section>

      <!-- 4. FORUM / GROUND -->
      <section id="forum" class="forum">
        <div class="section-head">
          <h2>On paper<br>vs on the ground.</h2>
          <p>The BMC's numbers, next to what residents of {{ ward.name }} actually see. Post, like, reply, share, or turn a post into a petition.</p>
        </div>
        <Forum :ward-slug="wardSlug" :ward-code="ward.code" :ward-name="ward.name" :services="ward.services" :posts="posts" :counts="flags?.counts ?? {}" :initial-service="forumService" :open-form="showPostForm" @refresh="refreshFlags()" @celebrate="celebrate()" @petition="startPetition" @petitions-changed="petitionsKey++" />
      </section>

      <!-- 5. PETITIONS -->
      <section id="petitions">
        <div class="section-head"><h2>Put your<br>name on it.</h2><p>Grievances with numbers attached. Every petition carries the ward's own budget figures and goes to the ward office.</p></div>
        <Petitions :key="petitionsKey" :ward-slug="wardSlug" :ward-code="ward.code" :services="ward.services" :preselect="petitionPreselect" />
      </section>

      <!-- MEMES -->
      <section id="memes" class="meme-zone">
        <div class="section-head"><h2>The civic<br>meme audit.</h2><p>Every meme is attached to a real number on this page. Funny first, receipt immediately after.</p></div>
        <div class="memes">
          <article class="meme red"><div class="emoji">🧮</div><span class="kicker">When {{ cr(latestBE) }} becomes {{ cr(latestActual) }}</span><div class="copy">Budget: "Stay within me."<br><br>Spending: "I don't think I will."</div><p class="desc">{{ ward.code }} was allotted {{ cr(latestBE) }} in {{ latestYear }} and recorded {{ cr(latestActual) }} in spend: {{ latestUtil }}% utilisation. Above 100% can include expenditure booked by central departments.</p></article>
          <article class="meme blue"><div class="emoji">🕳️</div><span class="kicker">Storm water drains · {{ Math.round(ward.services[2].avgUtil * 100) }}%</span><div class="copy">The drain budget didn't overflow.<br><br>The spend did.</div><p class="desc">The point is not "{{ Math.round(ward.services[2].avgUtil * 100) }}% = corruption". The point is that number deserves an explanation residents can actually ask for. The RTI button is right there.</p></article>
          <article class="meme yellow"><div class="emoji">📚</div><span class="kicker">How to find your ward's spend</span><div class="copy">Step 1: open 1,000-page PDF.<br>Step 2: lose will to live.<br>Step 3: file RTI.</div><p class="desc">BMC budgets are organised by department, not neighbourhood. Ward actuals on this page come from RTI-sourced Praja Foundation reports joined with BMC budget documents.</p></article>
          <article class="meme green"><div class="emoji">🧾</div><span class="kicker">₹1 lakh fine · ₹24 crore work</span><div class="copy">Contract value: huge.<br>Penalty: "best I can do is pocket change."</div><p class="desc">{{ ctx.penaltyExample.text }} The bigger gap: the BMC does not publish project lists, delays and penalties ward by ward.</p></article>
        </div>
      </section>

      <!-- RECEIPTS -->
      <section id="receipts">
        <div class="section-head"><h2>Every number<br>we have.</h2><p>No "trust us". Source, year, and whether a number is actual, estimate or unavailable.</p></div>
        <div class="grid">
          <article class="card span12">
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

      <section class="close">
        <h2>You paid.<br>You should know.</h2>
        <p>The BMC is called the richest municipal corporation in the country. Every Mumbai resident pays for their ward. This makes the money visible, and turns "where did it go?" into a question the BMC has to answer.</p>
        <div class="cta-row center"><button class="btn primary" @click="openRti()">🧾 Ask the BMC</button><button class="btn act" @click="go('#petitions')">✍️ Sign a petition</button></div>
      </section>

      <footer>
        <div class="logo">Somehow We <b>Manage</b></div>
        <div class="disclaimer"><strong>CREATE 2026 prototype · 11 September 2026.</strong> Pilot ward: {{ ward.code }}, {{ ward.name }}. Ward actuals are not published by the BMC; Praja Foundation obtained them under the Right to Information Act. Utilisation above 100% means recorded spend exceeded the allotment. Humour targets bureaucracy, never residents or individuals.</div>
      </footer>

      <!-- RTI MODAL -->
      <div v-if="rtiOpen" class="modal" @click.self="rtiOpen = false">
        <div class="modal-card">
          <div class="modal-top">
            <div><span class="pill green">Ready-to-file RTI</span><h3>Ask for the breakdown.</h3><p class="mini">{{ svc.icon }} {{ svc.label }} · {{ ward.code }} · {{ Math.round(svc.avgUtil * 100) }}% utilisation</p></div>
            <button class="x" @click="rtiOpen = false" aria-label="Close">✕</button>
          </div>
          <div class="svc-tabs"><button v-for="s in ward.services" :key="s.key" class="pill" :class="{ ink: selected === s.key }" @click="selected = s.key">{{ s.icon }} {{ s.label }}</button></div>
          <RtiDraft :ward-code="ward.code" :ward-name="ward.name" :service="svc" :years="ward.years" />
        </div>
      </div>

      <div v-if="confettiOn" class="confetti" aria-hidden="true"><i v-for="(c, i) in confetti" :key="i" class="piece" :style="{ left: c.left, animationDelay: c.delay, background: c.bg }"></i></div>
    </div>
  </div>
</template>

<style scoped>
.ticker { background: var(--ink); color: var(--white); white-space: nowrap; overflow: hidden; border-bottom: 3px solid var(--ink); }
.track { display: inline-block; padding: 10px 0; animation: ticker 28s linear infinite; font-weight: 900; font-size: 13px; }
.track span span { margin-right: 38px; }
@keyframes ticker { to { transform: translateX(-50%); } }
nav { position: sticky; top: 0; z-index: 30; display: flex; align-items: center; justify-content: space-between; gap: 16px; padding: 12px 5vw; background: rgba(244,239,223,.94); backdrop-filter: blur(10px); border-bottom: 2px solid var(--ink); }
.logo { font-weight: 900; font-size: 20px; letter-spacing: -0.045em; white-space: nowrap; }
.logo b { background: var(--yellow); padding: 3px 7px; border: 2px solid var(--ink); border-radius: 7px; box-shadow: 3px 3px 0 var(--ink); }
nav .links { display: flex; gap: 16px; font-weight: 900; font-size: 13px; text-transform: uppercase; }
nav a { text-decoration: none; }
.hero { display: grid; grid-template-columns: 1.15fr .85fr; gap: 34px; padding: 64px 6vw 48px; align-items: center; border-bottom: 3px solid var(--ink); }
.idbar { display: flex; gap: 8px; flex-wrap: wrap; }
h1 { font-size: clamp(56px, 8.4vw, 128px); line-height: .84; letter-spacing: -.075em; margin: 22px 0; text-transform: uppercase; }
.hero p { font-size: clamp(18px, 2vw, 24px); line-height: 1.25; font-weight: 700; max-width: 760px; }
.cta-row { display: flex; gap: 12px; flex-wrap: wrap; margin-top: 26px; }
.cta-row.center { justify-content: center; }
.herocard { transform: rotate(1.5deg); }
.herocard .slash { font-family: var(--display); font-size: clamp(64px, 9vw, 140px); line-height: .8; letter-spacing: -.07em; margin: 14px 0; }
.herocard p { font-size: 18px; font-weight: 700; margin: 0 0 8px; }
.mini { font-size: 12px; font-weight: 700; color: #3f3b34; }
section { padding: 72px 6vw; border-bottom: 3px solid var(--ink); }
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
.svc-actions { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 12px; }
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
footer { padding: 34px 6vw 50px; font-weight: 700; }
.disclaimer { background: var(--white); border: 2px dashed var(--ink); padding: 14px; border-radius: 12px; margin-top: 14px; font-size: 14px; }
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
</style>
