<script setup lang="ts">
const props = defineProps<{
  wardCode: string
  wardName: string
  service: { key: string; label: string; icon: string; avgUtil: number; be: number[]; actual: (number | null)[]; mumbaiAvgUtil?: number | null }
  posts: any[]            // all posts for this ward
  siteUrl: string
  post?: any              // when set, the card is about this one complaint
}>()

type Fmt = 'square' | 'story' | 'wide'
const fmt = ref<Fmt>('square')
const sizes: Record<Fmt, [number, number, string]> = { square: [1080, 1080, 'WhatsApp · Instagram post'], story: [1080, 1920, 'Instagram / WhatsApp story'], wide: [1200, 630, 'X · LinkedIn · link preview'] }
const canvas = ref<HTMLCanvasElement | null>(null)
const status = ref('')

const sum3 = (a: (number | null)[]) => a.slice(0, 3).reduce((x, y) => (x ?? 0) + (y ?? 0), 0) as number
const svcPosts = computed(() => props.posts.filter(p => p.service === props.service.key))
const photoPost = computed(() => props.post?.photo ? props.post : svcPosts.value.find(p => p.photo))
const daysAgo = (ts: number) => Math.max(0, Math.round((Date.now() - ts) / 86400000))
const spent = computed(() => sum3(props.service.actual))
const allotted = computed(() => sum3(props.service.be))
const util = computed(() => Math.round(props.service.avgUtil * 100))
const oldestDays = computed(() => svcPosts.value.length ? Math.max(0, Math.round((Date.now() - Math.min(...svcPosts.value.map(p => p.ts))) / 86400000)) : 0)
const perPost = computed(() => svcPosts.value.length ? spent.value / svcPosts.value.length : null)
const crore = (n: number) => n >= 100 ? `₹${Math.round(n).toLocaleString('en-IN')} CRORE` : `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 1 })} CRORE`
const punch = computed(() => {
  if (util.value >= 300) return "The budget didn't overflow. The spend did."
  if (util.value >= 150) return 'Something doesn\'t add up.'
  if (util.value >= 105) return 'Over budget. Under-delivered?'
  if (util.value < 90) return 'Money left on the table. Not on your road.'
  return 'On budget. So where is it?'
})
const caption = computed(() => props.post
  ? `${props.wardCode} ${props.wardName.toUpperCase()} — ${props.service.label.toUpperCase()}\n"${props.post.title || props.post.note}"${props.post.locality ? ' · ' + props.post.locality : ''}\n${props.post.confirms ?? 0} people say this is still here\n${crore(spent.value)} SPENT on ${props.service.label.toLowerCase()} (${util.value}% of budget)\nIs your ward any better? Check your PIN → ${props.siteUrl}`
  : `${props.wardCode} ${props.wardName.toUpperCase()} — ${props.service.label.toUpperCase()}\n${crore(spent.value)} SPENT (${util.value}% of budget)\n${svcPosts.value.length} resident report${svcPosts.value.length === 1 ? '' : 's'} ${svcPosts.value.length === 1 ? 'says' : 'say'} they don't see it\n${punch.value}\nIs your ward any better? Check your PIN → ${props.siteUrl}`)

function loadImg(src: string) {
  // remote photos go through our proxy so the canvas stays untainted regardless of browser cache state
  const url = /^https?:/.test(src) ? `/api/img?u=${encodeURIComponent(src)}` : src
  return new Promise<HTMLImageElement>((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = url })
}
function rr(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); }
function fit(ctx: CanvasRenderingContext2D, text: string, maxW: number, start: number, min: number, family: string) {
  let s = start; ctx.font = `900 ${s}px ${family}`
  while (ctx.measureText(text).width > maxW && s > min) { s -= 4; ctx.font = `900 ${s}px ${family}` }
  return s
}
function wrap(ctx: CanvasRenderingContext2D, text: string, maxW: number) {
  const words = text.split(' '), lines: string[] = []; let line = ''
  for (const w of words) { const t = line ? `${line} ${w}` : w; if (ctx.measureText(t).width > maxW && line) { lines.push(line); line = w } else line = t }
  if (line) lines.push(line); return lines
}

async function draw() {
  const c = canvas.value; if (!c) return
  const [W, H] = sizes[fmt.value]
  c.width = W; c.height = H
  const ctx = c.getContext('2d')!
  const D = '"Archivo Black","Arial Black",Inter,system-ui,sans-serif'
  const B = 'Inter,system-ui,sans-serif'
  try { await (document as any).fonts?.load(`900 100px ${D}`); await (document as any).fonts?.load(`800 40px ${B}`) } catch {}

  // background: photo if we have one, else paper
  ctx.fillStyle = '#F4EFDF'; ctx.fillRect(0, 0, W, H)
  if (photoPost.value?.photo) {
    try {
      const img = await loadImg(photoPost.value.photo)
      const s = Math.max(W / img.width, H / img.height)
      const dw = img.width * s, dh = img.height * s
      ctx.filter = 'grayscale(0.35) contrast(1.05)'
      ctx.drawImage(img, (W - dw) / 2, (H - dh) / 2, dw, dh)
      ctx.filter = 'none'
      const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, 'rgba(17,17,17,.78)'); g.addColorStop(1, 'rgba(17,17,17,.92)')
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H)
    } catch {}
  } else {
    ctx.fillStyle = '#111'; ctx.fillRect(0, 0, W, H)
  }

  const pad = Math.round(W * 0.07)
  const wide = fmt.value === 'wide'
  let y = pad

  // kicker pill
  const kick = `${props.wardCode.toUpperCase()} WARD — ${props.service.label.toUpperCase()}`
  ctx.font = `900 ${wide ? 22 : 30}px ${B}`
  const kw = ctx.measureText(kick).width + 44, kh = wide ? 44 : 58
  ctx.fillStyle = '#FFD84D'; rr(ctx, pad, y, kw, kh, 999); ctx.fill(); ctx.lineWidth = 4; ctx.strokeStyle = '#111'; ctx.stroke()
  ctx.fillStyle = '#111'; ctx.textBaseline = 'middle'; ctx.fillText(kick, pad + 22, y + kh / 2)
  y += kh + (wide ? 22 : 40)
  ctx.textBaseline = 'alphabetic'

  // big block
  ctx.fillStyle = '#fff'
  if (props.post) {
    const hs = wide ? 44 : 64
    ctx.font = `900 ${hs}px ${D}`
    for (const line of wrap(ctx, (props.post.title || props.post.note).toUpperCase(), W - pad * 2).slice(0, wide ? 3 : 4)) { y += hs * 0.95; ctx.fillText(line, pad - 2, y) }
    ctx.font = `800 ${wide ? 26 : 40}px ${B}`; ctx.fillStyle = '#FF88C7'; y += wide ? 40 : 60
    ctx.fillText(`${props.post.confirms ?? 0} PEOPLE SAY IT'S STILL HERE`, pad, y)
  } else {
    const big = crore(spent.value)
    const bs = fit(ctx, big, W - pad * 2, wide ? 96 : 150, 60, D)
    ctx.font = `900 ${bs}px ${D}`; y += bs * 0.9; ctx.fillText(big, pad - 4, y)
    ctx.font = `800 ${wide ? 26 : 40}px ${B}`; ctx.fillStyle = '#FF88C7'; y += wide ? 40 : 60
    ctx.fillText(`SPENT · ${util.value}% OF BUDGET`, pad, y)
  }

  // stats lines
  const stats = props.post ? [
    `${crore(spent.value)} spent on ${props.service.label.toLowerCase()} · ${util.value}% of budget`,
    `Reported ${daysAgo(props.post.ts)} day${daysAgo(props.post.ts) === 1 ? '' : 's'} ago${props.post.locality ? ' · ' + props.post.locality : ''}`,
    props.post.lastConfirmed ? `Last seen ${daysAgo(props.post.lastConfirmed) === 0 ? 'today' : daysAgo(props.post.lastConfirmed) + ' days ago'}` : `${svcPosts.value.length} complaints on ${props.service.label.toLowerCase()} in this ward`,
  ] : [
    `${svcPosts.value.length} resident report${svcPosts.value.length === 1 ? '' : 's'} say they don't see it`,
    svcPosts.value.length ? `Oldest report: ${oldestDays.value} day${oldestDays.value === 1 ? '' : 's'} ago` : `Allotted: ${crore(allotted.value)}`,
    perPost.value != null ? `₹${perPost.value.toLocaleString('en-IN', { maximumFractionDigits: 1 })} crore spent per reported issue` : `Mumbai average: ${props.service.mumbaiAvgUtil ? Math.round(props.service.mumbaiAvgUtil * 100) + '%' : 'n/a'}`,
  ]
  ctx.fillStyle = '#F4EFDF'; ctx.font = `700 ${wide ? 24 : 36}px ${B}`
  y += wide ? 44 : 70
  for (const s of stats) { ctx.fillText(s, pad, y); y += wide ? 34 : 52 }

  // punchline
  y += wide ? 10 : 30
  ctx.fillStyle = '#B7FF4A'
  const ps = wide ? 44 : 64
  ctx.font = `900 ${ps}px ${D}`
  for (const line of wrap(ctx, punch.value, W - pad * 2)) { y += ps * 0.95; ctx.fillText(line, pad - 2, y) }

  // footer block pinned to bottom
  const fh = wide ? 120 : 200
  const fy = H - fh
  ctx.fillStyle = '#FFD84D'; ctx.fillRect(0, fy, W, fh)
  ctx.fillStyle = '#111'; ctx.fillRect(0, fy, W, 5)
  ctx.font = `900 ${wide ? 30 : 46}px ${D}`
  const cta = 'Is your ward any better?'
  ctx.fillText(cta, pad, fy + (wide ? 46 : 78))
  ctx.font = `800 ${wide ? 22 : 32}px ${B}`
  ctx.fillText(`→ Check your PIN code at ${props.siteUrl.replace(/^https?:\/\//, '')}`, pad, fy + (wide ? 84 : 132))
  ctx.font = `700 ${wide ? 14 : 20}px ${B}`; ctx.fillStyle = '#3f3b34'
  ctx.fillText(`SOURCE: BMC ward budgets 2021-22 to 2023-24 via Praja Foundation (RTI). Resident reports from this site.`, pad, fy + fh - (wide ? 16 : 26))
}
watch([fmt, () => props.service.key, () => props.posts.length, () => props.post?.id], () => nextTick(draw))
onMounted(() => nextTick(draw))

function blob(): Promise<Blob> { return new Promise(res => canvas.value!.toBlob(b => res(b!), 'image/png')) }
function filename() { return `receipt-${props.wardCode.replace('/', '')}-${props.service.key}${props.post ? '-' + props.post.id : ''}-${fmt.value}.png` }
async function download() {
  const b = await blob(); const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = filename(); a.click(); URL.revokeObjectURL(a.href)
  status.value = 'Saved. Post it.'
}
async function share() {
  const b = await blob(); const file = new File([b], filename(), { type: 'image/png' })
  const n = navigator as any
  if (n.share && n.canShare?.({ files: [file] })) { try { await n.share({ files: [file], text: caption.value }); status.value = 'Shared.' } catch {} }
  else { try { await navigator.clipboard.writeText(caption.value); await download(); status.value = 'Image saved, caption copied. Paste both.' } catch { await download() } }
}
async function copyCaption() { try { await navigator.clipboard.writeText(caption.value); status.value = 'Caption copied.' } catch {} }
</script>

<template>
  <div class="receipt">
    <div class="fmts">
      <button v-for="(v, k) in sizes" :key="k" class="pill" :class="{ ink: fmt === k }" @click="fmt = k as Fmt">{{ k === 'square' ? '1:1' : k === 'story' ? '9:16' : '16:9' }} · {{ v[2] }}</button>
    </div>
    <div class="stage" :class="fmt"><canvas ref="canvas" :aria-label="caption"></canvas></div>
    <div class="acts">
      <button class="btn primary" @click="share">Share receipt</button>
      <button class="btn" @click="download">Download PNG</button>
      <button class="btn" @click="copyCaption">Copy caption</button>
    </div>
    <p class="status" aria-live="polite">{{ status }}</p>
    <p class="mini">{{ post ? 'This card is about your complaint, with the ward\'s spend for context.' : 'Built from this page\'s numbers.' }} {{ photoPost ? 'Background: the complaint photo.' : 'Add a photo to a post and it becomes the background.' }}</p>
  </div>
</template>

<style scoped>
.receipt { display: grid; gap: 12px; }
.fmts { display: flex; flex-wrap: wrap; gap: 8px; }
.fmts .pill { cursor: pointer; min-height: 36px; }
.stage { display: grid; place-items: center; background: #d9d2bd; border: 3px solid var(--ink); border-radius: 18px; padding: 12px; }
.stage canvas { max-width: 100%; height: auto; border: 3px solid var(--ink); box-shadow: 7px 7px 0 var(--ink); background: #111; }
.stage.square canvas { max-width: 480px; }
.stage.story canvas { max-height: 640px; width: auto; }
.stage.wide canvas { max-width: 100%; }
.acts { display: flex; flex-wrap: wrap; gap: 10px; }
.status { font-weight: 900; min-height: 22px; margin: 0; }
.mini { font-size: 12px; font-weight: 700; color: #3f3b34; margin: 0; }
</style>
