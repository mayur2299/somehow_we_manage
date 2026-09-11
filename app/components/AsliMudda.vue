<script setup lang="ts">
// The name, swapping one character at a time between Devanagari and Latin.
// Split by grapheme cluster, never by code point, or Devanagari matras detach.
const WORDS = [
  { text: 'असली मुद्दा', lang: 'hi', script: 'deva' },
  { text: 'Asli Mudda', lang: 'en', script: 'latn' },
]
const LABEL = 'Asli Mudda'

function graphemes(s: string): string[] {
  try {
    const Seg = (Intl as any).Segmenter
    if (Seg) return [...new Seg('hi', { granularity: 'grapheme' }).segment(s)].map((g: any) => g.segment)
  } catch {}
  const out: string[] = []
  for (const ch of s) {
    const c = ch.codePointAt(0)!
    const mark = (c >= 0x0900 && c <= 0x0903) || (c >= 0x093a && c <= 0x094f) ||
                 (c >= 0x0951 && c <= 0x0957) || (c >= 0x0962 && c <= 0x0963) || c === 0x200d
    if (mark && out.length) out[out.length - 1] += ch
    else out.push(ch)
  }
  return out
}

const FORMS = WORDS.map(w => ({ ...w, chars: graphemes(w.text) }))
const WIDTH = Math.max(...FORMS.map(f => f.chars.length))
const at = (f: typeof FORMS[number], n: number) => f.chars[n] ?? ''

const idx = ref(0)
const script = ref(FORMS[0].script)
const lang = ref(FORMS[0].lang)
// one cell per position; bump `v` to replay that cell's fade
const cells = ref(Array.from({ length: WIDTH }, (_, n) => ({ ch: at(FORMS[0], n), v: 0 })))

let loop: ReturnType<typeof setInterval> | null = null
const pending: ReturnType<typeof setTimeout>[] = []

function swapTo(next: number) {
  const f = FORMS[next]
  script.value = f.script
  lang.value = f.lang
  for (let n = 0; n < WIDTH; n++) {
    pending.push(setTimeout(() => {
      cells.value[n] = { ch: at(f, n), v: cells.value[n].v + 1 }
    }, n * 70))
  }
}

onMounted(() => {
  let reduced = false
  try { reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches } catch {}
  if (reduced) return
  loop = setInterval(() => {
    idx.value = (idx.value + 1) % FORMS.length
    swapTo(idx.value)
  }, 4600)
})
onBeforeUnmount(() => { if (loop) clearInterval(loop); pending.forEach(clearTimeout) })
</script>

<template>
  <h1 class="am" :aria-label="LABEL">
    <span class="sr">{{ LABEL }}</span>
    <span class="word" :class="script" :lang="lang" aria-hidden="true">
      <span v-for="(cell, n) in cells" :key="n" class="slot" :class="{ space: cell.ch === ' ', empty: cell.ch === '' }">
        <span :key="cell.v" class="ch">{{ cell.ch === ' ' ? ' ' : cell.ch }}</span>
      </span>
    </span>
  </h1>
</template>

<style scoped>
.am { margin: 0 0 26px; min-height: 1.15em; line-height: 1.2; text-transform: none; font-weight: 700; }
.sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); }
.word { display: inline-flex; align-items: baseline; }

/* Hind carries the Devanagari only; the Latin keeps the site's display face. */
.word.deva { font-family: 'Hind', system-ui, sans-serif; font-weight: 700; font-size: clamp(46px, 8.4vw, 116px); letter-spacing: -0.01em; line-height: 1.3; }
.word.latn { font-family: var(--display); font-weight: 900; font-size: clamp(48px, 8.6vw, 124px); letter-spacing: -0.055em; text-transform: uppercase; line-height: 1.02; }

.slot { display: inline-block; }
.slot.space { width: .3em; }
.slot.empty { width: 0; }
.ch { display: inline-block; animation: fade 260ms ease both; }

@keyframes fade {
  from { opacity: 0; }
  to   { opacity: 1; }
}
@media (prefers-reduced-motion: reduce) { .ch { animation: none; } }
</style>
