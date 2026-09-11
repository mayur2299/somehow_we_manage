<script setup lang="ts">
// The one place we use Hind: the name, alternating between Devanagari and Latin.
const WORDS = [
  { text: 'असली मुद्दा', lang: 'hi', label: 'Asli Mudda' },
  { text: 'Asli Mudda', lang: 'en', label: 'Asli Mudda' },
]
const i = ref(0)
const out = ref(false)
let timer: ReturnType<typeof setInterval> | null = null
const reduced = ref(false)

const current = computed(() => WORDS[i.value])
const chars = computed(() => [...current.value.text])

onMounted(() => {
  try { reduced.value = window.matchMedia('(prefers-reduced-motion: reduce)').matches } catch {}
  if (reduced.value) return
  timer = setInterval(() => {
    out.value = true
    setTimeout(() => { i.value = (i.value + 1) % WORDS.length; out.value = false }, 420)
  }, 3800)
})
onBeforeUnmount(() => { if (timer) clearInterval(timer) })
</script>

<template>
  <h1 class="am" :aria-label="current.label">
    <span :key="current.text" class="word" :lang="current.lang" :class="{ out }">
      <span
        v-for="(c, n) in chars"
        :key="n"
        class="ch"
        :class="{ space: c === ' ' }"
        :style="{ transitionDelay: `${(out ? (chars.length - n - 1) : n) * 26}ms` }"
        aria-hidden="true"
      >{{ c === ' ' ? ' ' : c }}</span>
    </span>
  </h1>
</template>

<style scoped>
.am {
  font-family: 'Hind', 'Archivo Black', system-ui, sans-serif;
  font-weight: 700;
  font-size: clamp(52px, 9vw, 128px);
  line-height: 1.05;
  letter-spacing: -0.02em;
  text-transform: none;
  margin: 0 0 28px;
  min-height: 1.1em;
}
.word { display: inline-flex; flex-wrap: wrap; }
.ch {
  display: inline-block;
  opacity: 1;
  transform: translateY(0) rotate(0deg);
  transition: opacity 380ms cubic-bezier(.2, .8, .2, 1), transform 380ms cubic-bezier(.2, .8, .2, 1);
  will-change: opacity, transform;
}
.ch.space { width: .28em; }
.word.out .ch { opacity: 0; transform: translateY(-0.34em) rotate(-4deg); }
@starting-style { .ch { opacity: 0; transform: translateY(0.34em); } }
@media (prefers-reduced-motion: reduce) {
  .ch { transition: none; opacity: 1 !important; transform: none !important; }
}
</style>
