<script setup lang="ts">
// The name, alternating Devanagari and Latin. Split by grapheme cluster, never by
// code point, or Devanagari matras detach from their consonants.
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

const HOLD = 5200      // how long each form stays
const LEAVE = 760      // ms for a word to leave
const STAGGER = 70     // ms between characters

const i = ref(0)
const phase = ref<'in' | 'out'>('in')
let timer: ReturnType<typeof setInterval> | null = null
let t2: ReturnType<typeof setTimeout> | null = null

const current = computed(() => WORDS[i.value])
const chars = computed(() => graphemes(current.value.text))

onMounted(() => {
  let reduced = false
  try { reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches } catch {}
  if (reduced) return
  timer = setInterval(() => {
    phase.value = 'out'
    const leaveTotal = LEAVE + STAGGER * chars.value.length
    t2 = setTimeout(() => { i.value = (i.value + 1) % WORDS.length; phase.value = 'in' }, leaveTotal)
  }, HOLD)
})
onBeforeUnmount(() => { if (timer) clearInterval(timer); if (t2) clearTimeout(t2) })

// leaving: last character first. landing: first character first.
const delay = (n: number) => `${(phase.value === 'out' ? chars.value.length - 1 - n : n) * STAGGER}ms`
</script>

<template>
  <h1 class="am" :aria-label="LABEL">
    <span class="sr">{{ LABEL }}</span>
    <span :key="current.text + phase" class="word" :class="[phase, current.script]" :lang="current.lang" aria-hidden="true">
      <span v-for="(c, n) in chars" :key="n" class="ch" :class="{ space: c === ' ' }" :style="{ animationDelay: delay(n) }">{{ c === ' ' ? '\u00a0' : c }}</span>
    </span>
  </h1>
</template>

<style scoped>
.am { margin: 0 0 26px; min-height: 1.15em; line-height: 1.2; text-transform: none; font-weight: 700; }
.sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); }
.word { display: inline-flex; flex-wrap: wrap; }
.word.deva { font-family: 'Hind', system-ui, sans-serif; font-weight: 700; font-size: clamp(46px, 8.4vw, 116px); letter-spacing: -0.01em; line-height: 1.3; }
.word.latn { font-family: var(--display); font-weight: 900; font-size: clamp(48px, 8.6vw, 124px); letter-spacing: -0.055em; text-transform: uppercase; line-height: 1.02; }
.ch { display: inline-block; will-change: transform, opacity; backface-visibility: hidden; }
.ch.space { width: .3em; }
.word.in .ch  { animation: land  760ms cubic-bezier(.16, 1, .3, 1) both; }
.word.out .ch { animation: leave 760ms cubic-bezier(.5, 0, .75, .2) both; }
@keyframes land  { from { opacity: 0; transform: translateY(.45em); } to { opacity: 1; transform: none; } }
@keyframes leave { from { opacity: 1; transform: none; } to { opacity: 0; transform: translateY(-.4em); } }
@media (prefers-reduced-motion: reduce) { .word.in .ch, .word.out .ch { animation: none; } }
</style>
