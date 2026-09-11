<script setup lang="ts">
// The one place Hind is used: the name, alternating Devanagari and Latin.
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
  // fallback: keep every combining mark with the base character before it
  const out: string[] = []
  for (const ch of s) {
    const code = ch.codePointAt(0)!
    const combining = (code >= 0x0900 && code <= 0x0903) || (code >= 0x093a && code <= 0x094f) ||
                      (code >= 0x0951 && code <= 0x0957) || (code >= 0x0962 && code <= 0x0963) || code === 0x200d
    if (combining && out.length) out[out.length - 1] += ch
    else out.push(ch)
  }
  return out
}

const i = ref(0)
const phase = ref<'in' | 'out'>('in')
const reduced = ref(false)
let timer: ReturnType<typeof setInterval> | null = null

const current = computed(() => WORDS[i.value])
const chars = computed(() => graphemes(current.value.text))

onMounted(() => {
  try { reduced.value = window.matchMedia('(prefers-reduced-motion: reduce)').matches } catch {}
  if (reduced.value) return
  timer = setInterval(() => {
    phase.value = 'out'
    setTimeout(() => { i.value = (i.value + 1) % WORDS.length; phase.value = 'in' }, 520)
  }, 4200)
})
onBeforeUnmount(() => { if (timer) clearInterval(timer) })

// out: last letter leaves first. in: first letter lands first.
const delay = (n: number) => `${(phase.value === 'out' ? chars.value.length - 1 - n : n) * 34}ms`
</script>

<template>
  <h1 class="am" :aria-label="LABEL">
    <span class="sr">{{ LABEL }}</span>
    <span :key="current.text + phase" class="word" :lang="current.lang" :class="[phase, current.script]" aria-hidden="true">
      <span
        v-for="(c, n) in chars"
        :key="n"
        class="ch"
        :class="{ space: c === ' ' }"
        :style="{ animationDelay: delay(n) }"
      >{{ c === ' ' ? ' ' : c }}</span>
    </span>
  </h1>
</template>

<style scoped>
.am {
  margin: 0 0 26px;
  min-height: 1.15em;
  line-height: 1.2;
  text-transform: none;
  font-weight: 700;
}
/* Hind carries the Devanagari only. The Latin keeps the site's display face. */
.word.deva {
  font-family: 'Hind', system-ui, sans-serif;
  font-weight: 700;
  font-size: clamp(46px, 8.4vw, 116px);
  letter-spacing: -0.01em;
  line-height: 1.3;
}
.word.latn {
  font-family: var(--display);
  font-weight: 900;
  font-size: clamp(48px, 8.6vw, 124px);
  letter-spacing: -0.055em;
  text-transform: uppercase;
  line-height: 1.02;
}
.sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); }
.word { display: inline-flex; flex-wrap: wrap; }
.ch { display: inline-block; will-change: transform, opacity; backface-visibility: hidden; }
.ch.space { width: .3em; }

.word.in .ch { animation: land 520ms cubic-bezier(.16, 1, .3, 1) both; }
.word.out .ch { animation: leave 520ms cubic-bezier(.6, 0, .8, .2) both; }

@keyframes land {
  from { opacity: 0; transform: translateY(0.55em) rotate(6deg) scale(.86); }
  60%  { opacity: 1; }
  to   { opacity: 1; transform: none; }
}
@keyframes leave {
  from { opacity: 1; transform: none; }
  to   { opacity: 0; transform: translateY(-0.5em) rotate(-6deg) scale(.9); }
}
@media (prefers-reduced-motion: reduce) {
  .word.in .ch, .word.out .ch { animation: none; opacity: 1; transform: none; }
}
</style>
