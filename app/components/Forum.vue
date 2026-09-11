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
}>()
const emit = defineEmits<{ (e: 'refresh'): void; (e: 'petition', service: string): void; (e: 'celebrate'): void; (e: 'petitionsChanged'): void }>()

const cr = (n: number) => `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 1 })} cr`
const sum3 = (a: (number | null)[]) => a.slice(0, 3).reduce((x, y) => (x ?? 0) + (y ?? 0), 0) as number
const svcOf = (k: string) => props.services.find(s => s.key === k)

// filters
const tab = ref<'residents' | 'elsewhere'>('residents')
const service = ref<string>('all')
const tag = ref<string>('all')
const sort = ref<'new' | 'top' | 'talked'>('new')
const showForm = ref(!!props.openForm)
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
  if (service.value === 'all') { const t = props.services.reduce((a, s) => a + sum3(s.actual), 0); return { amount: cr(t), what: 'on these six services' } }
  const s = svcOf(service.value)!; return { amount: cr(sum3(s.actual)), what: `on ${s.label.toLowerCase()} (${Math.round(s.avgUtil * 100)}% of budget)` }
})

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
async function confirm(p: any, file?: File) {
  if (confirmed.value[p.id] && !file) return
  confirmed.value[p.id] = true
  try {
    const photo = file ? await compress(file) : undefined
    await $fetch(`/api/flags/${encodeURIComponent(`${p.ward}:${p.service}:${p.id}`)}/confirm`, { method: 'POST', body: { photo } })
    emit('refresh'); toast.value = file ? 'Photo added. Still there, on record.' : 'Counted. Still there, on record.'
  } catch { confirmed.value[p.id] = false }
}
function onConfirmPhoto(p: any, e: Event) { const f = (e.target as HTMLInputElement).files?.[0]; if (f) confirm(p, f) }
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

// share + permalink
const toast = ref('')
watch(toast, v => { if (v) setTimeout(() => (toast.value = ''), 2000) })
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
  <div class="forum">
    <div class="grid">
      <article class="card pink span5 contrast">
        <span class="pill">{{ service === 'all' ? 'All services' : `${svcOf(service)?.icon} ${svcOf(service)?.label}` }}</span>
        <div class="big">{{ spentLine.amount }}</div>
        <div class="vs">spent on paper {{ spentLine.what }}</div>
        <div class="big">{{ filtered.length }}</div>
        <div class="vs">resident post{{ filtered.length === 1 ? '' : 's' }} saying otherwise<span v-if="photoCount">, {{ photoCount }} with photos</span></div>
        <button class="btn flag" @click="showForm = !showForm; tab = 'residents'">{{ showForm ? 'Close' : '🚩 I don\'t see this on the ground' }}</button>
      </article>
      <article class="card span7 toolbar">
        <div class="tabs">
          <button class="pill" :class="{ ink: tab === 'residents' }" @click="tab = 'residents'">Residents · {{ totalPosts }}</button>
          <button class="pill" :class="{ ink: tab === 'elsewhere' }" @click="tab = 'elsewhere'">Elsewhere · r/mumbai</button>
        </div>
        <template v-if="tab === 'residents'">
          <p class="label">Service</p>
          <div class="tags">
            <button class="pill" :class="{ ink: service === 'all' }" @click="service = 'all'">All</button>
            <button v-for="s in services" :key="s.key" class="pill" :class="{ ink: service === s.key }" @click="service = s.key">{{ s.icon }} {{ s.label }}<span v-if="counts[s.key]"> · {{ counts[s.key] }}</span></button>
          </div>
          <p class="label">What is wrong</p>
          <div class="tags">
            <button class="pill" :class="{ red: tag === 'all' }" @click="tag = 'all'">All</button>
            <button v-for="t in FLAG_TAGS" :key="t.key" class="pill" :class="{ red: tag === t.key }" @click="tag = t.key">{{ t.label }}</button>
          </div>
          <p class="label">Sort</p>
          <div class="tags">
            <button class="pill" :class="{ ink: sort === 'new' }" @click="sort = 'new'">Newest</button>
            <button class="pill" :class="{ ink: sort === 'top' }" @click="sort = 'top'">Most liked</button>
            <button class="pill" :class="{ ink: sort === 'talked' }" @click="sort = 'talked'">Most discussed</button>
          </div>
        </template>
        <p v-else class="mini">Public Reddit search for "{{ wardName }}" in r/mumbai, cached hourly. Residents' words, not verified facts. <span class="pill" :class="threads.source === 'snapshot' ? 'purple' : 'green'">{{ threads.source === 'snapshot' ? 'Cached snapshot' : 'Live' }}</span></p>
      </article>

      <article v-if="showForm && tab === 'residents'" class="card span12">
        <h3>Post what you see.</h3>
        <FlagIssue :ward-slug="wardSlug" :service-key="service === 'all' ? services[0].key : service" :services="services" @flagged="emit('refresh'); emit('celebrate'); showForm = false" />
      </article>

      <template v-if="tab === 'residents'">
        <article v-for="p in filtered" :key="p.id" :id="`post-${p.id}`" class="card post span4">
          <img v-if="p.photo" :src="p.photo" alt="" />
          <div class="body">
            <div class="tags"><span class="pill">{{ svcOf(p.service)?.icon }} {{ svcOf(p.service)?.label }}</span><span class="pill red">{{ tagLabel(p.tag) }}</span><span v-if="p.locality" class="pill">📍 {{ p.locality }}</span></div>
            <p class="note">{{ p.note || 'Photo only' }}</p>
            <div class="foot">
              <span class="mini">{{ when(p.ts) }}</span>
              <div class="acts">
                <button class="btn sm" :disabled="liked[p.id]" @click="like(p)">👍 {{ p.likes ?? 0 }}</button>
                <button class="btn sm" @click="toggle(p)">💬 {{ p.comments ?? 0 }}</button>
                <button class="btn sm" @click="share(p)">Share</button>
              </div>
            </div>

            <div class="still">
              <div class="still-head">
                <span class="still-n">{{ p.confirms ?? 0 }}</span>
                <span class="still-t">{{ (p.confirms ?? 0) === 1 ? 'person says' : 'people say' }} this is still here<span v-if="p.lastConfirmed"> · last seen {{ daysSince(p.lastConfirmed) === 0 ? 'today' : daysSince(p.lastConfirmed) + 'd ago' }}</span></span>
              </div>
              <div class="still-acts">
                <button class="btn sm act" :disabled="confirmed[p.id]" @click="confirm(p)">{{ confirmed[p.id] ? '✓ Counted' : '👀 Yes, I\'ve seen it' }}</button>
                <label class="btn sm"><input type="file" accept="image/*" capture="environment" hidden @change="onConfirmPhoto(p, $event)" />📸 Add photo</label>
                <button class="btn sm" @click="shareAsk(p)">Ask neighbours</button>
              </div>
              <div v-if="(p.photos ?? []).length > 1" class="still-photos"><img v-for="(ph, i) in p.photos.slice(-4)" :key="i" :src="ph" alt="" /></div>
            </div>

            <div class="pet-strip" :class="petitionFor(p) ? 'has' : ''">
              <template v-if="petitionFor(p)">
                <div class="pet-info">
                  <span class="pill green">Petition raised</span>
                  <p class="pet-title">{{ petitionFor(p).title }}</p>
                  <p class="mini"><strong>{{ petitionFor(p).signatures }}</strong> {{ petitionFor(p).signatures === 1 ? 'signature' : 'signatures' }} · {{ petitionFor(p).status === 'open' ? 'collecting signatures' : petitionFor(p).status }}</p>
                </div>
                <button class="btn sm act" :disabled="signedP[petitionFor(p).id]" @click="signFor(p)">{{ signedP[petitionFor(p).id] ? '✓ Signed' : '✍️ Sign this' }}</button>
              </template>
              <template v-else>
                <p class="mini">No petition on this yet.</p>
                <button class="btn sm" @click="startRaise(p)">{{ raising[p.id] ? 'Cancel' : '✍️ Raise a petition' }}</button>
              </template>
            </div>

            <form v-if="raising[p.id]" class="raise" @submit.prevent="raise(p)">
              <input v-model="pTitle[p.id]" class="input" maxlength="120" placeholder="Petition title" />
              <textarea v-model="pDemand[p.id]" class="input" rows="6" maxlength="600"></textarea>
              <p class="mini">Pre-filled with this post and {{ wardCode }}'s own budget figures. Edit anything.</p>
              <button class="btn sm act" type="submit" :disabled="pBusy[p.id]">{{ pBusy[p.id] ? 'Raising…' : 'Publish petition' }}</button>
            </form>
            <div v-if="open[p.id]" class="comments">
              <p v-if="!comments[p.id]" class="mini">Loading…</p>
              <p v-else-if="!comments[p.id].length" class="mini">No replies yet.</p>
              <div v-for="c in comments[p.id] ?? []" :key="c.id" class="comment"><p>{{ c.text }}</p><span class="mini">{{ when(c.ts) }}</span></div>
              <form class="reply" @submit.prevent="comment(p)">
                <input v-model="draft[p.id]" class="input" maxlength="400" placeholder="Add what you know…" />
                <button class="btn sm primary" type="submit" :disabled="busy[p.id]">Reply</button>
              </form>
            </div>
          </div>
        </article>
        <p v-if="!filtered.length" class="span12 empty">No posts match. Be the first to say what you see.</p>
      </template>

      <template v-else>
        <a v-for="t in threads.items" :key="t.url + t.title" class="card thread span4" :href="t.url" target="_blank" rel="noopener">
          <span class="t-title">{{ t.title }}</span>
          <span class="mini">r/{{ t.sub }} · ▲ {{ t.score }} · 💬 {{ t.comments }} · {{ new Date(t.created).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) }}</span>
        </a>
        <p v-if="!threads.items.length" class="span12 empty">Nothing found yet.</p>
      </template>
    </div>
    <div v-if="toast" class="toast">{{ toast }}</div>
  </div>
</template>

<style scoped>
.grid { display: grid; grid-template-columns: repeat(12, 1fr); gap: 18px; }
.span4 { grid-column: span 4; } .span5 { grid-column: span 5; } .span7 { grid-column: span 7; } .span12 { grid-column: span 12; }
.contrast .big { font-family: var(--display); font-size: clamp(44px, 6vw, 84px); letter-spacing: -.06em; line-height: .9; margin-top: 10px; }
.contrast .vs { font-weight: 900; font-size: 18px; margin: 6px 0 14px; }
.toolbar { display: grid; gap: 8px; align-content: start; }
.tabs { display: flex; gap: 8px; margin-bottom: 6px; }
.tags { display: flex; flex-wrap: wrap; gap: 8px; }
.tags .pill, .tabs .pill { cursor: pointer; min-height: 36px; }
.label { margin: 6px 0 0; }
.mini { font-size: 12px; font-weight: 700; color: #3f3b34; }
h3 { font-size: 26px; letter-spacing: -.05em; margin: 0 0 12px; }
.post { padding: 0; overflow: hidden; display: flex; flex-direction: column; }
.post img { width: 100%; height: 190px; object-fit: cover; border-bottom: 3px solid var(--ink); display: block; }
.body { padding: 14px; display: grid; gap: 8px; }
.note { margin: 0; font-weight: 700; }
.foot { display: flex; justify-content: space-between; align-items: center; gap: 8px; flex-wrap: wrap; }
.acts { display: flex; gap: 6px; flex-wrap: wrap; }
.still { border-top: 2px dashed var(--ink); padding-top: 10px; display: grid; gap: 8px; }
.still-head { display: flex; align-items: baseline; gap: 8px; }
.still-n { font-family: var(--display); font-size: 34px; letter-spacing: -.05em; line-height: 1; }
.still-t { font-weight: 800; font-size: 13px; text-transform: uppercase; letter-spacing: .03em; }
.still-acts { display: flex; flex-wrap: wrap; gap: 6px; }
.still-acts label { cursor: pointer; }
.still-photos { display: flex; gap: 6px; }
.still-photos img { width: 56px; height: 56px; object-fit: cover; border: 2px solid var(--ink); border-radius: 8px; }
.pet-strip { border-top: 2px dashed var(--ink); padding-top: 10px; display: flex; justify-content: space-between; align-items: center; gap: 10px; flex-wrap: wrap; }
.pet-strip.has { background: #f3ffe0; border: 2px solid var(--ink); border-radius: 12px; padding: 10px; }
.pet-info { display: grid; gap: 4px; min-width: 0; flex: 1; }
.pet-title { margin: 0; font-weight: 800; font-size: 14px; line-height: 1.25; }
.raise { display: grid; gap: 8px; border-top: 2px dashed var(--ink); padding-top: 10px; }
.raise .btn { justify-self: start; }
.comments { border-top: 2px dashed var(--ink); padding-top: 10px; display: grid; gap: 8px; }
.comment { background: var(--white); border: 2px solid var(--ink); border-radius: 12px; padding: 8px 10px; }
.comment p { margin: 0 0 2px; font-weight: 600; font-size: 14px; }
.reply { display: flex; gap: 8px; }
.reply .input { min-height: 40px; }
.empty { font-weight: 800; margin: 0; }
.thread { display: grid; gap: 6px; text-decoration: none; align-content: start; }
.t-title { font-weight: 800; line-height: 1.3; }
.toast { position: fixed; bottom: 18px; left: 50%; transform: translateX(-50%); background: var(--ink); color: var(--white); border-radius: 999px; padding: 10px 16px; font-weight: 800; z-index: 120; }
@media (max-width: 920px) { .span4, .span5, .span7 { grid-column: span 12; } }
</style>
