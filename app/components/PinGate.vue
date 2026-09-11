<script setup lang="ts">
const props = defineProps<{ pincodes: { pin: string; area: string; slug: string }[] }>()
const emit = defineEmits<{ (e: 'found', payload: { pin: string; area: string }): void }>()
import { WARDS } from '~/utils/wards'
const wardOf = (slug: string) => WARDS[slug]
const pin = ref('')
const error = ref('')

function fill() { pin.value = '400069'; error.value = '' }
function lookup() {
  const v = pin.value.trim()
  if (!/^\d{6}$/.test(v)) { error.value = 'That PIN looks a little lost. Enter exactly 6 digits.'; return }
  const hit = props.pincodes.find(p => p.pin === v)
  if (!hit) { error.value = 'That PIN is not in our Mumbai map yet. Try 400069 (Andheri East) or 400050 (Bandra West).'; return }
  error.value = ''
  emit('found', { pin: v, area: hit.area })
}
</script>

<template>
  <div class="gate">
    <div class="shell">
      <main class="main">
        <span class="kye big" aria-label="Know Your Enemy"><b>Know Your</b><b>Enemy</b></span>
        <h1>Start with<br>your PIN.</h1>
        <p>You shouldn't need to know your BMC ward number to ask where your neighbourhood's money went. Give us your six-digit Mumbai PIN. All 24 wards, {{ pincodes.length }} pincodes. We'll do the civic alphabet soup.</p>
        <form class="pin-form" @submit.prevent="lookup">
          <input v-model="pin" class="pin-input" inputmode="numeric" maxlength="6" autocomplete="postal-code" placeholder="e.g. 400069" aria-label="Mumbai PIN code" />
          <button class="btn act" type="submit">Find my ward →</button>
        </form>
        <p class="err" aria-live="polite">{{ error }}</p>
        <p class="sample">Try <button type="button" class="link" @click="fill">400069 · Andheri East</button> · <button type="button" class="link" @click="pin = '400050'; error = ''">400050 · Bandra West</button> · <button type="button" class="link" @click="pin = '400080'; error = ''">400080 · Mulund</button></p>
      </main>
      <aside class="side">
        <div>
          <span class="pill">One PIN. Every number.</span>
          <h2>What you'll know in 30 seconds.</h2>
          <div class="list">
            <div class="item">📍 Your BMC ward and who represents it</div>
            <div class="item">💸 Money allotted vs actually spent</div>
            <div class="item">🕳️ Roads, drains, garbage, health and more</div>
            <div class="item">📸 What residents see on the ground</div>
            <div class="item">🧾 A ready-to-file RTI and a petition to sign</div>
          </div>
        </div>
        <p class="joke">BMC has 1,000-page PDFs.<br>You have one PIN code.<br><u>Fair fight.</u></p>
      </aside>
    </div>

  </div>
</template>

<style scoped>
.gate { position: fixed; inset: 0; z-index: 200; background: var(--paper); display: grid; place-items: center; padding: 24px; overflow: auto; }
.shell { width: min(1120px, 100%); display: grid; grid-template-columns: 1.15fr .85fr; gap: 28px; }
.main, .side { border: 2px solid var(--ink); border-radius: 30px; box-shadow: 4px 4px 0 var(--ink); }
.main { background: var(--white); padding: clamp(28px, 5vw, 58px); }
.side { background: var(--stone); padding: 30px; display: flex; flex-direction: column; justify-content: space-between; gap: 24px; }
.tilt { background: var(--coral); color: var(--white); border-color: var(--coral); transform: rotate(-2deg); box-shadow: 3px 3px 0 var(--ink); }
h1 { font-size: clamp(56px, 8vw, 116px); margin: 18px 0 22px; text-transform: uppercase; letter-spacing: -0.075em; line-height: 0.84; }
.main p { font-size: clamp(18px, 2vw, 24px); font-weight: 700; max-width: 720px; line-height: 1.25; margin: 0; }
.pin-form { display: flex; gap: 10px; max-width: 650px; margin-top: 28px; }
.pin-input { min-width: 0; flex: 1; border: 2px solid var(--ink); border-radius: 15px; padding: 14px 18px; font-size: 22px; font-weight: 900; background: var(--white); box-shadow: 3px 3px 0 var(--ink); letter-spacing: 0.08em; }
.err { font-weight: 900; margin-top: 12px; min-height: 24px; font-size: 15px !important; }
.sample { margin-top: 8px; font-size: 13px !important; font-weight: 800 !important; }
.link { border: 0; background: none; text-decoration: underline; font-weight: 900; cursor: pointer; padding: 0; font-size: inherit; }
.side h2 { font-size: 44px; margin: 12px 0; letter-spacing: -0.05em; line-height: 0.95; }
.list { display: grid; gap: 10px; margin-top: 16px; }
.item { background: var(--white); border: 2px solid var(--ink); border-radius: 14px; padding: 12px; font-weight: 800; box-shadow: 3px 3px 0 var(--ink); }
.joke { font-family: var(--display); font-size: 30px; line-height: 1; letter-spacing: -0.04em; margin: 0; }
.bigline { font-family: var(--display); font-size: clamp(24px, 4vw, 44px); line-height: 1.05; letter-spacing: -0.04em; margin: 0; }
.micro { font-weight: 700; max-width: 600px; margin: 14px auto 24px; }
@keyframes pop { from { transform: scale(.92); opacity: 0; } to { transform: none; opacity: 1; } }
@media (max-width: 820px) { .shell { grid-template-columns: 1fr; } .side { display: none; } .pin-form { flex-direction: column; } .main { padding: 28px; } h1 { font-size: 56px; } }
.kye.big { transform: rotate(-2deg); padding: 8px 12px; }
.kye.big b { font-size: 26px; }
</style>
