<script setup lang="ts">
import { FLAG_TAGS, tagLabel } from '~/utils/tags'
const props = defineProps<{
  wardSlug: string
  wardCode: string
  wardName: string
  services: { key: string; label: string; icon: string; avgUtil: number; be: number[]; actual: (number | null)[] }[]
  posts: any[]
  counts: Record<string, number>
  initialService?: string
  openForm?: boolean
  full?: boolean
}>()
const emit = defineEmits<{ (e: 'refresh'): void; (e: 'petition', service: string): void; (e: 'celebrate'): void; (e: 'petitionsChanged'): void; (e: 'receipt', service: string): void }>()

const cr = (n: number) => `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 1 })} cr`
const sum3 = (a: (number | null)[]) => a.slice(0, 3).reduce((x, y) => (x ?? 0) + (y ?? 0), 0) as number
const svcOf = (k: string) => props.services.find(s => s.key === k)

// filters
const tab = ref<'residents' | 'elsewhere'>('residents')
// default to the service with the most complaints, else drains
const busiest = () => { const e = Object.entries(props.counts).sort((a, b) => b[1] - a[1])[0]; return e && e[1] > 0 ? e[0] : 'swd' }
const service = ref<string>(props.initialService ?? 'all')
const tag = ref<string>('all')
const sort = ref<'new' | 'top' | 'talked'>('new')
const showForm = ref(!!props.openForm)
const showFilters = ref(false)
const emitReceipt = (k: string) => emit('receipt', k)
const totalConfirms = computed(() => filtered.value.reduce((a, p) => a + (p.confirms ?? 0), 0))
watch(() => props.initialService, v => { if (v) { service.value = v; tab.value = 'residents' } })
watch(() => props.openForm, v => { if (v) showForm.value = true })

const filtered = computed(() => {
  let list = props.posts.slice()
  if (service.value !== 'all') list = list.filter(p => p.service === service.value)
  if (tag.value !== 'all') list = list.filter(p => p.tag === tag.value)
  if (sort.value === 'top') list.sort((a, b) => (b.likes ?? 0) - (a.likes ?? 0) || b.ts - a.ts)
  else if (sort.value === 'talked') list.sort((a, b) => (b.comments ?? 0) - (a.comments ?? 0) || b.ts - a.ts)
  else list.sort((a, b) => b.ts - a.ts)
  return list
})
const photoCount = computed(() => filtered.value.filter(p => p.photo).length)
const totalPosts = computed(() => props.posts.length)
const spentLine = computed(() => {
  if (service.value === 'all') { const t = props.services.reduce((a, s) => a + sum3(s.actual), 0); return { amount: cr(t), what: 'on these six services, 2021-22 to 2023-24', util: null as number | null } }
  const s = svcOf(service.value)!; return { amount: cr(sum3(s.actual)), what: `on ${s.label.toLowerCase()}, 2021-22 to 2023-24`, util: Math.round(s.avgUtil * 100) }
})
// chat order: oldest first, newest at the bottom
const chatOrder = computed(() => filtered.value.slice().sort((a, b) => a.ts - b.ts))
const feed = ref<HTMLElement | null>(null)
function scrollBottom() { nextTick(() => { const el = feed.value; if (el) el.scrollTop = el.scrollHeight }) }
watch([service, () => props.posts.length], scrollBottom)
onMounted(scrollBottom)
const dayLabel = (ts: number) => { const d = new Date(ts); const today = new Date(); const diff = Math.round((today.setHours(0,0,0,0) - new Date(d).setHours(0,0,0,0)) / 86400000); return diff === 0 ? 'Today' : diff === 1 ? 'Yesterday' : d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) }
const showDay = (i: number) => i === 0 || dayLabel(chatOrder.value[i - 1].ts) !== dayLabel(chatOrder.value[i].ts)
const hhmm = (ts: number) => new Date(ts).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
const totalMeToo = computed(() => props.posts.reduce((a, p) => a + (p.confirms ?? 0), 0))

// likes
const liked = ref<Record<string, boolean>>({})
async function like(p: any) {
  if (liked.value[p.id]) return
  liked.value[p.id] = true
  try { await $fetch(`/api/flags/${encodeURIComponent(`${p.ward}:${p.service}:${p.id}`)}/like`, { method: 'POST' }); emit('refresh') } catch { liked.value[p.id] = false }
}

// comments
const open = ref<Record<string, boolean>>({})
const comments = ref<Record<string, any[]>>({})
const draft = ref<Record<string, string>>({})
const busy = ref<Record<string, boolean>>({})
async function toggle(p: any) {
  open.value[p.id] = !open.value[p.id]
  if (open.value[p.id] && !comments.value[p.id]) await loadComments(p)
}
async function loadComments(p: any) {
  try { const r = await $fetch<{ comments: any[] }>(`/api/flags/${encodeURIComponent(`${p.ward}:${p.service}:${p.id}`)}/comments`); comments.value[p.id] = r.comments } catch { comments.value[p.id] = [] }
}
async function comment(p: any) {
  const text = (draft.value[p.id] ?? '').trim()
  if (text.length < 2) return
  busy.value[p.id] = true
  try {
    await $fetch(`/api/flags/${encodeURIComponent(`${p.ward}:${p.service}:${p.id}`)}/comments`, { method: 'POST', body: { text } })
    draft.value[p.id] = ''
    await loadComments(p); emit('refresh')
    nextTick(() => { const el = document.querySelector(`#post-${p.id} .rlist`) as HTMLElement | null; if (el) el.scrollTop = el.scrollHeight })
  } catch {} finally { busy.value[p.id] = false }
}

// "still there?" confirmations
const confirmed = ref<Record<string, boolean>>({})
async function compress(file: File) {
  const img = new Image(); img.src = URL.createObjectURL(file); await new Promise(r => (img.onload = r))
  const max = 900, sc = Math.min(1, max / Math.max(img.width, img.height))
  const c = document.createElement('canvas'); c.width = Math.round(img.width * sc); c.height = Math.round(img.height * sc)
  c.getContext('2d')!.drawImage(img, 0, 0, c.width, c.height); URL.revokeObjectURL(img.src)
  return c.toDataURL('image/jpeg', 0.7)
}
async function confirmSeen(p: any, file?: File) {
  if (confirmed.value[p.id] && !file) return
  confirmed.value[p.id] = true
  try {
    const photo = file ? await compress(file) : undefined
    await $fetch(`/api/flags/${encodeURIComponent(`${p.ward}:${p.service}:${p.id}`)}/confirm`, { method: 'POST', body: { photo } })
    emit('refresh'); toast.value = file ? 'Photo added. Still there, on record.' : 'Counted. Still there, on record.'
  } catch { confirmed.value[p.id] = false }
}
function onConfirmPhoto(p: any, e: Event) { const f = (e.target as HTMLInputElement).files?.[0]; if (f) confirmSeen(p, f) }
const daysSince = (ts: number) => Math.max(0, Math.round((Date.now() - ts) / 86400000))
function askConfirm(p: any) {
  const where = p.locality ? ` near ${p.locality}` : ` in ${props.wardName}`
  const text = `Can anyone${where} confirm this ${tagLabel(p.tag).toLowerCase()} ${svcOf(p.service)?.label.toLowerCase()} issue is still there? "${p.note}"\n${p.confirms ?? 0} people say it is. Tap YES, I'VE SEEN IT or add a photo:\n${permalink(p)}`
  return text
}
async function shareAsk(p: any) {
  const text = askConfirm(p)
  if (navigator.share) { try { await navigator.share({ text }) } catch {} }
  else { try { await navigator.clipboard.writeText(text); toast.value = 'Copied. Send it to your building group.' } catch {} }
}

// share menu (per platform) + report
const shareOpen = ref<Record<string, boolean>>({})
function shareText(p: any) {
  const s = svcOf(p.service)!
  return `${s.icon} ${p.title || tagLabel(p.tag) + ' · ' + s.label} — ${props.wardCode} ${props.wardName}${p.locality ? ', ' + p.locality : ''}\n"${p.note}"\n${p.confirms ?? 0} people say it's still there. ${props.wardCode} spent ${cr(sum3(s.actual))} on ${s.label.toLowerCase()}, ${Math.round(s.avgUtil * 100)}% of budget.\nIs your ward any better? ${permalink(p)}`
}
const enc = (t: string) => encodeURIComponent(t)
const links = (p: any) => ({
  whatsapp: `https://wa.me/?text=${enc(shareText(p))}`,
  x: `https://twitter.com/intent/tweet?text=${enc(shareText(p).slice(0, 260))}`,
  facebook: `https://www.facebook.com/sharer/sharer.php?u=${enc(permalink(p))}&quote=${enc(shareText(p).slice(0, 200))}`,
})
async function copyLink(p: any) { try { await navigator.clipboard.writeText(permalink(p)); toast.value = 'Link copied.' } catch {} }
const reported = ref<Record<string, boolean>>({})
async function report(p: any) {
  if (reported.value[p.id]) return
  if (!confirm('Report this post as abusive, false, or off-topic?')) return
  reported.value[p.id] = true
  try { const r = await $fetch<{ hidden: boolean }>(`/api/flags/${encodeURIComponent(`${p.ward}:${p.service}:${p.id}`)}/report`, { method: 'POST' }); toast.value = r.hidden ? 'Hidden pending review.' : 'Reported. Thanks.'; if (r.hidden) emit('refresh') } catch { reported.value[p.id] = false }
}

// share + permalink
const toast = ref('')
watch(toast, v => { if (v) setTimeout(() => (toast.value = ''), 2200) })
const justPosted = ref(false)
function onPosted() { emit('refresh'); emit('celebrate'); showForm.value = false; justPosted.value = true; scrollBottom(); setTimeout(() => (justPosted.value = false), 12000) }
function permalink(p: any) { return `${location.origin}${location.pathname}?pin=${new URLSearchParams(location.search).get('pin') ?? '400069'}#post-${p.id}` }
async function share(p: any) {
  const s = svcOf(p.service)!
  const text = `${s.icon} ${s.label} in ${props.wardCode} ${props.wardName}: ${tagLabel(p.tag)}${p.locality ? ' at ' + p.locality : ''}. "${p.note}"\n${props.wardCode} recorded ${cr(sum3(s.actual))} spent on ${s.label.toLowerCase()}, ${Math.round(s.avgUtil * 100)}% of budget.\n${permalink(p)}`
  if (navigator.share) { try { await navigator.share({ text }) } catch {} }
  else { try { await navigator.clipboard.writeText(text); toast.value = 'Copied. Paste it anywhere.' } catch {} }
}
onMounted(() => {
  const m = location.hash.match(/^#post-(.+)$/)
  if (m) { const p = props.posts.find(x => x.id === m[1]); if (p) { service.value = 'all'; nextTick(() => { document.getElementById(`post-${p.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' }); open.value[p.id] = true; loadComments(p) }) } }
})

// petitions linked to posts
const petitions = ref<any[]>([])
async function loadPetitions() {
  try { const r = await $fetch<{ petitions: any[] }>(`/api/petitions?ward=${props.wardSlug}`); petitions.value = r.petitions } catch {}
}
onMounted(loadPetitions)
const petitionFor = (p: any) => petitions.value.find(x => x.fromFlag === p.id)
const signedP = ref<Record<string, boolean>>({})
async function signFor(p: any) {
  const pet = petitionFor(p)
  if (!pet || signedP.value[pet.id]) return
  signedP.value[pet.id] = true
  try { await $fetch(`/api/petitions/${encodeURIComponent(`${pet.ward}:${pet.id}`)}/sign`, { method: 'POST' }); await loadPetitions(); emit('petitionsChanged'); toast.value = 'Signed. Your name is on it.' }
  catch { signedP.value[pet.id] = false }
}

// raise a petition straight from a post
const raising = ref<Record<string, boolean>>({})
const pTitle = ref<Record<string, string>>({})
const pDemand = ref<Record<string, string>>({})
const pBusy = ref<Record<string, boolean>>({})
function startRaise(p: any) {
  raising.value[p.id] = !raising.value[p.id]
  if (!raising.value[p.id]) return
  const s = svcOf(p.service)!
  const util = Math.round(s.avgUtil * 100)
  const where = p.locality ? ` at ${p.locality}` : ''
  pTitle.value[p.id] = pTitle.value[p.id] || `${s.label}${where}: ${tagLabel(p.tag).toLowerCase()}`
  pDemand.value[p.id] = pDemand.value[p.id] || `A resident of ${props.wardCode} (${props.wardName}) reports${where}: "${p.note}"\n\n${props.wardCode} recorded ${cr(sum3(s.actual))} spent on ${s.label.toLowerCase()} between 2021-22 and 2023-24, ${util}% of what was allotted. We ask the Assistant Municipal Commissioner to inspect this location, publish the works and contractors behind that spend, and tell residents what will be fixed and by when.`
}
async function raise(p: any) {
  const title = (pTitle.value[p.id] ?? '').trim()
  const demand = (pDemand.value[p.id] ?? '').trim()
  if (title.length < 8 || demand.length < 20) { toast.value = 'Add a title and what you are asking for.'; return }
  pBusy.value[p.id] = true
  try {
    await $fetch('/api/petitions', { method: 'POST', body: { ward: props.wardSlug, service: p.service, title, demand, fromFlag: p.id } })
    raising.value[p.id] = false
    await loadPetitions(); emit('petitionsChanged'); emit('celebrate')
    toast.value = 'Petition raised from this post.'
  } catch (e: any) { toast.value = e?.data?.statusMessage || 'Could not save.' }
  finally { pBusy.value[p.id] = false }
}

// threads (elsewhere)
const threads = ref<{ source: string; items: any[] }>({ source: 'snapshot', items: [] })
onMounted(async () => { try { threads.value = await $fetch(`/api/threads?q=${encodeURIComponent(props.wardName)}`) } catch {} })

const when = (ts: number) => new Date(ts).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
</script>

<template>
  <div class="chat" :class="{ full }">
    <!-- group header -->
    <header class="chead">
      <div class="avatar">📍</div>
      <div class="cmeta">
        <div class="cname">{{ wardCode }} · {{ wardName }} residents</div>
        <div class="csub">{{ posts.length }} complaints · {{ totalMeToo }} "me too" · no login, no names</div>
      </div>
      <button class="btn sm primary" @click="emitReceipt(service === 'all' ? 'swd' : service)">🧾 Share card</button>
    </header>

    <!-- channels -->
    <div class="channels">
      <button class="pill" :class="{ ink: service === 'all' }" @click="service = 'all'">All · {{ posts.length }}</button>
      <button v-for="s in services" :key="s.key" class="pill" :class="{ ink: service === s.key }" @click="service = s.key">{{ s.icon }} {{ s.label }} · {{ counts[s.key] ?? 0 }}</button>
      <button class="pill" :class="{ red: showFilters }" @click="showFilters = !showFilters">Filter</button>
      <button class="pill" :class="{ purple: tab === 'elsewhere' }" @click="tab = tab === 'elsewhere' ? 'residents' : 'elsewhere'">r/mumbai</button>
    </div>
    <div v-if="showFilters" class="filters">
      <button class="pill" :class="{ red: tag === 'all' }" @click="tag = 'all'">Any problem</button>
      <button v-for="t in FLAG_TAGS" :key="t.key" class="pill" :class="{ red: tag === t.key }" @click="tag = t.key">{{ t.label }}</button>
    </div>

    <!-- feed -->
    <div ref="feed" class="feed">
      <!-- pinned: on paper -->
      <div class="msg system">
        <div class="pin">📌 Pinned · On paper</div>
        <div class="sys-big">{{ spentLine.amount }}</div>
        <div class="sys-sub">spent {{ spentLine.what }}<span v-if="spentLine.util"> · <strong>{{ spentLine.util }}% of budget</strong></span></div>
        <div class="sys-sub">Below: what residents see on the ground. Same problem? Tap <strong>me too</strong>.</div>
      </div>

      <template v-if="tab === 'residents'">
        <p v-if="!chatOrder.length" class="empty">Nobody has posted about {{ service === 'all' ? 'this ward' : svcOf(service)?.label.toLowerCase() }} yet. Be the first.</p>
        <template v-for="(p, i) in chatOrder" :key="p.id">
          <div v-if="showDay(i)" class="day"><span>{{ dayLabel(p.ts) }}</span></div>
          <article :id="`post-${p.id}`" class="msg">
            <div class="who"><span class="av">{{ svcOf(p.service)?.icon }}</span><span class="name">Resident<span v-if="p.locality"> · {{ p.locality }}</span></span><span class="time">{{ hhmm(p.ts) }}</span></div>
            <div class="bubble">
              <div class="tags"><span class="pill red">{{ tagLabel(p.tag) }}</span><span class="pill">{{ svcOf(p.service)?.label }}</span></div>
              <h4 v-if="p.title" class="ptitle">{{ p.title }}</h4>
              <p class="note">{{ p.note }}</p>
              <div v-if="p.photo" class="photo"><img :src="p.photo" alt="" referrerpolicy="no-referrer" /><span v-if="p.photoCredit" class="credit">{{ p.photoCredit }}</span></div>
              <div v-if="(p.photos ?? []).length > 1" class="more-photos"><img v-for="(ph, j) in p.photos.slice(-4)" :key="j" :src="ph" alt="" /></div>

              <div class="react">
                <button class="chip act" :disabled="confirmed[p.id]" @click="confirmSeen(p)">👀 {{ confirmed[p.id] ? 'Counted' : 'Me too' }} · {{ p.confirms ?? 0 }}</button>
                <button class="chip" @click="toggle(p)">💬 {{ p.comments ?? 0 }}</button>
                <label class="chip"><input type="file" accept="image/*" capture="environment" hidden @change="onConfirmPhoto(p, $event)" />📸</label>
                <button class="chip" @click="shareOpen[p.id] = !shareOpen[p.id]">↗ Share</button>
                <button class="chip" @click="emitReceipt(p.service)">🧾</button>
                <button class="chip ghost" :disabled="reported[p.id]" @click="report(p)">⚑</button>
              </div>
              <p v-if="p.lastConfirmed" class="seen">Last seen {{ daysSince(p.lastConfirmed) === 0 ? 'today' : daysSince(p.lastConfirmed) + ' days ago' }}</p>

              <div v-if="shareOpen[p.id]" class="sharemenu">
                <a class="chip" :href="links(p).whatsapp" target="_blank" rel="noopener">WhatsApp</a>
                <a class="chip" :href="links(p).x" target="_blank" rel="noopener">X</a>
                <a class="chip" :href="links(p).facebook" target="_blank" rel="noopener">Facebook</a>
                <button class="chip" @click="emitReceipt(p.service)">Instagram card</button>
                <button class="chip" @click="copyLink(p)">Copy link</button>
                <button class="chip" @click="shareAsk(p)">Ask neighbours</button>
              </div>

              <div class="pet" :class="{ has: petitionFor(p) }">
                <template v-if="petitionFor(p)">
                  <span>✍️ <strong>{{ petitionFor(p).signatures }}</strong> signed: {{ petitionFor(p).title }}</span>
                  <button class="chip act" :disabled="signedP[petitionFor(p).id]" @click="signFor(p)">{{ signedP[petitionFor(p).id] ? 'Signed' : 'Sign' }}</button>
                </template>
                <template v-else>
                  <span>Want the ward office to answer?</span>
                  <button class="chip" @click="startRaise(p)">{{ raising[p.id] ? 'Cancel' : '✍️ Raise petition' }}</button>
                </template>
              </div>
              <form v-if="raising[p.id]" class="raise" @submit.prevent="raise(p)">
                <input v-model="pTitle[p.id]" class="input" maxlength="120" placeholder="Petition title" />
                <textarea v-model="pDemand[p.id]" class="input" rows="5" maxlength="600"></textarea>
                <button class="btn sm act" type="submit" :disabled="pBusy[p.id]">{{ pBusy[p.id] ? 'Raising…' : 'Publish petition' }}</button>
              </form>
            </div>

            <!-- replies -->
            <div v-if="open[p.id]" class="replies">
              <p v-if="!comments[p.id]" class="mini">Loading…</p>
              <div v-else class="rlist">
                <div v-for="c in comments[p.id] ?? []" :key="c.id" class="reply"><span class="ravatar">💬</span><div class="rbubble"><p>{{ c.text }}</p><span class="rtime">{{ hhmm(c.ts) }} · {{ dayLabel(c.ts) }}</span></div></div>
              </div>
              <form class="rform" @submit.prevent="comment(p)">
                <input v-model="draft[p.id]" class="input" maxlength="400" placeholder="Reply…" />
                <button class="btn sm primary" type="submit" :disabled="busy[p.id]">Send</button>
              </form>
            </div>
          </article>
        </template>
        <div v-if="justPosted" class="msg system green">
          <div class="pin">✅ Posted</div>
          <div class="sys-sub">Now make it travel. The share card carries this count and the ward's spend.</div>
          <button class="btn sm primary" @click="emitReceipt(service === 'all' ? 'swd' : service)">🧾 Generate share card</button>
        </div>
      </template>

      <template v-else>
        <div class="msg system purple">
          <div class="pin">r/mumbai · {{ threads.source === 'snapshot' ? 'cached snapshot' : 'live' }}</div>
          <div class="sys-sub">Public Reddit search for "{{ wardName }}". Residents' words, not verified facts.</div>
        </div>
        <a v-for="t in threads.items" :key="t.url + t.title" class="msg thread" :href="t.url" target="_blank" rel="noopener">
          <div class="who"><span class="av">👽</span><span class="name">r/{{ t.sub }}</span><span class="time">▲ {{ t.score }} · 💬 {{ t.comments }}</span></div>
          <div class="bubble"><p class="note">{{ t.title }}</p></div>
        </a>
      </template>
    </div>

    <!-- composer -->
    <div class="composer">
      <div v-if="!showForm" class="bar">
        <button class="input fake" @click="showForm = true">🚩 Report a problem in {{ wardCode }}…</button>
        <button class="btn primary" @click="showForm = true">Post</button>
      </div>
      <div v-else class="form">
        <div class="form-head"><strong>Report a problem</strong><button class="chip" @click="showForm = false">Cancel</button></div>
        <FlagIssue :ward-slug="wardSlug" :service-key="service === 'all' ? 'roads' : service" :services="services" @flagged="onPosted" />
      </div>
    </div>

    <div v-if="toast" class="toast">{{ toast }}</div>
  </div>
</template>

<style scoped>
.chat { max-width: 760px; margin: 0 auto; width: 100%; border: 3px solid var(--ink); border-radius: 24px; background: var(--surface); box-shadow: 10px 10px 0 var(--ink); display: grid; grid-template-rows: auto auto auto 1fr auto; overflow: hidden; height: min(86vh, 980px); }
.chead { display: flex; align-items: center; gap: 12px; padding: 12px 16px; background: var(--ink); color: var(--white); }
.avatar { width: 44px; height: 44px; border-radius: 50%; background: var(--yellow); display: grid; place-items: center; font-size: 22px; border: 3px solid var(--white); }
.cmeta { flex: 1; min-width: 0; }
.cname { font-weight: 900; font-size: 16px; }
.csub { font-size: 12px; font-weight: 700; opacity: .8; }
.channels, .filters { display: flex; gap: 6px; padding: 10px 12px; overflow-x: auto; border-bottom: 2px solid var(--ink); background: var(--paper); scrollbar-width: none; }
.channels::-webkit-scrollbar, .filters::-webkit-scrollbar { display: none; }
.channels .pill, .filters .pill { cursor: pointer; min-height: 34px; flex: none; }
.feed { overflow-y: auto; padding: 14px 14px 20px; background: #efe8d3 url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24'%3E%3Ccircle cx='2' cy='2' r='1' fill='%23ddd4b8'/%3E%3C/svg%3E"); display: grid; gap: 12px; align-content: start; scroll-behavior: smooth; }
.day { display: flex; justify-content: center; }
.day span { background: var(--white); border: 2px solid var(--ink); border-radius: 999px; padding: 3px 10px; font-size: 11px; font-weight: 900; text-transform: uppercase; }
.msg { max-width: 92%; }
.msg.system { justify-self: center; max-width: 100%; background: var(--yellow); border: 3px solid var(--ink); border-radius: 16px; padding: 12px 14px; text-align: center; box-shadow: 4px 4px 0 var(--ink); }
.msg.system.green { background: var(--green); }
.msg.system.purple { background: var(--purple); }
.pin { font-size: 11px; font-weight: 900; text-transform: uppercase; letter-spacing: .06em; }
.sys-big { font-family: var(--display); font-size: clamp(36px, 6vw, 56px); letter-spacing: -.06em; line-height: 1; margin: 6px 0 2px; }
.sys-sub { font-weight: 700; font-size: 14px; margin-top: 4px; }
.who { display: flex; align-items: center; gap: 8px; font-size: 12px; font-weight: 800; margin: 0 0 4px 4px; color: #3f3b34; }
.av { width: 26px; height: 26px; border-radius: 50%; background: var(--white); border: 2px solid var(--ink); display: grid; place-items: center; font-size: 14px; }
.time { margin-left: auto; font-weight: 700; opacity: .7; }
.bubble { background: var(--white); border: 3px solid var(--ink); border-radius: 4px 18px 18px 18px; padding: 12px; display: grid; gap: 8px; box-shadow: 4px 4px 0 var(--ink); }
.tags { display: flex; gap: 6px; flex-wrap: wrap; }
.ptitle { font-size: 20px; letter-spacing: -.04em; line-height: 1.05; margin: 0; }
.note { margin: 0; font-weight: 600; font-size: 15px; line-height: 1.4; }
.photo { position: relative; border: 3px solid var(--ink); border-radius: 12px; overflow: hidden; }
.photo img { width: 100%; max-height: 360px; object-fit: cover; display: block; }
.credit { position: absolute; right: 6px; bottom: 6px; font-size: 10px; font-weight: 700; background: rgba(255,255,255,.85); border-radius: 6px; padding: 2px 6px; }
.more-photos { display: flex; gap: 6px; }
.more-photos img { width: 56px; height: 56px; object-fit: cover; border: 2px solid var(--ink); border-radius: 8px; }
.react { display: flex; flex-wrap: wrap; gap: 6px; }
.chip { display: inline-flex; align-items: center; gap: 4px; border: 2px solid var(--ink); background: var(--paper); border-radius: 999px; padding: 6px 10px; font: inherit; font-size: 13px; font-weight: 800; cursor: pointer; text-decoration: none; color: var(--ink); min-height: 34px; }
.chip.act { background: var(--green); }
.chip.ghost { border-color: #bbb; color: #777; background: transparent; }
.chip:disabled { opacity: .7; cursor: default; }
.seen { margin: 0; font-size: 11px; font-weight: 700; color: #6b665a; }
.sharemenu { display: flex; flex-wrap: wrap; gap: 6px; border-top: 2px dashed var(--ink); padding-top: 8px; }
.pet { display: flex; justify-content: space-between; align-items: center; gap: 8px; flex-wrap: wrap; border-top: 2px dashed var(--ink); padding-top: 8px; font-size: 13px; font-weight: 700; }
.pet.has { background: #f3ffe0; border: 2px solid var(--ink); border-radius: 10px; padding: 8px 10px; border-top-style: solid; }
.raise { display: grid; gap: 8px; }
.raise .btn { justify-self: start; }
.replies { margin: 8px 0 0 36px; display: grid; gap: 8px; }
.rlist { max-height: 240px; overflow-y: auto; display: grid; gap: 8px; padding-right: 4px; }
.reply { display: flex; gap: 8px; align-items: flex-start; }
.ravatar { width: 22px; height: 22px; border-radius: 50%; background: var(--white); border: 2px solid var(--ink); display: grid; place-items: center; font-size: 11px; flex: none; margin-top: 4px; }
.rbubble { background: var(--white); border: 2px solid var(--ink); border-radius: 4px 14px 14px 14px; padding: 8px 10px; }
.rbubble p { margin: 0; font-weight: 600; font-size: 14px; }
.rtime { font-size: 10px; font-weight: 700; color: #6b665a; }
.rform { display: flex; gap: 6px; }
.rform .input { min-height: 38px; }
.empty { text-align: center; font-weight: 800; padding: 30px 10px; }
.msg.thread { text-decoration: none; }
.composer { border-top: 3px solid var(--ink); background: var(--paper); padding: 10px 12px; }
.bar { display: flex; gap: 8px; }
.fake { text-align: left; color: #6b665a; font-weight: 700; cursor: text; flex: 1; }
.form { display: grid; gap: 8px; max-height: 50vh; overflow-y: auto; }
.form-head { display: flex; justify-content: space-between; align-items: center; }
.mini { font-size: 12px; font-weight: 700; color: #3f3b34; margin: 0; }
.toast { position: fixed; bottom: 18px; left: 50%; transform: translateX(-50%); background: var(--ink); color: var(--white); border-radius: 999px; padding: 10px 16px; font-weight: 800; z-index: 120; }
.chat.full { height: calc(100vh - 70px); max-width: 860px; border-radius: 0; border-left: 0; border-right: 0; border-bottom: 0; box-shadow: none; }
@media (max-width: 600px) { .chat { height: 88vh; border-radius: 18px; box-shadow: 6px 6px 0 var(--ink); } .msg { max-width: 100%; } .replies { margin-left: 16px; } }
</style>
