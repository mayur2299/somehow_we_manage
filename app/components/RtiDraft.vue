<script setup lang="ts">
const props = defineProps<{
  wardCode: string
  wardName: string
  service: { label: string; be: number[]; actual: (number | null)[]; avgUtil: number }
  years: string[]
}>()

const name = ref('')
const address = ref('')
const copied = ref(false)

const sum = (a: (number | null)[]) => a.slice(0, 3).reduce((x, y) => (x ?? 0) + (y ?? 0), 0) as number
const cr = (n: number) => `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 1 })} crore`

const text = computed(() => {
  const yrs = `${props.years[0]} to ${props.years[2]}`
  const be = sum(props.service.be)
  const ac = sum(props.service.actual)
  const util = Math.round(props.service.avgUtil * 100)
  return `To,
The Public Information Officer
Office of the Assistant Municipal Commissioner, ${props.wardCode} Ward
Municipal Corporation of Greater Mumbai

Subject: Application under Section 6(1) of the Right to Information Act, 2005 — expenditure on ${props.service.label.toLowerCase()} in ${props.wardCode} (${props.wardName}) ward

Sir/Madam,

Published ward-wise budget figures show that for ${props.service.label.toLowerCase()} in ${props.wardCode} ward, the budget estimate for ${yrs} was ${cr(be)} in total, while actual expenditure was ${cr(ac)}, i.e. about ${util}% of the estimate.

I request the following information for the years ${yrs}:

1. A list of all works undertaken under ${props.service.label.toLowerCase()} in ${props.wardCode} ward, with location, sanctioned cost, name of contractor, work order date, contractual completion date and actual completion date.
2. The reasons for the difference between the budget estimate and the actual expenditure in each year.
3. For each work completed after its contractual completion date, the period of delay and the liquidated damages or penalty levied on the contractor, if any.
4. Copies of inspection or quality audit reports for these works, if any.

I am a citizen of India. The application fee of ₹10 is enclosed. If the information is held by another public authority, kindly transfer this application under Section 6(3).

Name: ${name.value || '____________________'}
Address: ${address.value || '____________________'}
Date: ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}

Signature: ____________________`
})

async function copy() {
  try { await navigator.clipboard.writeText(text.value); copied.value = true; setTimeout(() => (copied.value = false), 1500) } catch {}
}
function download() {
  const blob = new Blob([text.value], { type: 'text/plain;charset=utf-8' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = `RTI-${props.wardCode.replace('/', '')}-${props.service.label.replace(/\s+/g, '-')}.txt`
  a.click()
  URL.revokeObjectURL(a.href)
}
</script>

<template>
  <div class="rti">
    <p class="lead">Turn this number into a question the BMC must answer within 30 days.</p>
    <div class="row">
      <input v-model="name" placeholder="Your name" />
      <input v-model="address" placeholder="Your address" />
    </div>
    <textarea readonly :value="text" rows="14"></textarea>
    <div class="actions">
      <button class="primary" @click="copy">{{ copied ? 'Copied' : 'Copy application' }}</button>
      <button @click="download">Download .txt</button>
    </div>
    <p class="fine">File in person at the ward office with a ₹10 court fee stamp, or online at rtionline.maharashtra.gov.in.</p>
  </div>
</template>

<style scoped>
.rti { margin-top: 0.9rem; background: #fffbea; border: 1px solid #f3e3a1; border-radius: 12px; padding: 0.9rem; }
.lead { margin: 0 0 0.6rem; font-weight: 600; }
.row { display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; margin-bottom: 0.5rem; }
input, textarea { width: 100%; box-sizing: border-box; border: 1px solid #ddd; border-radius: 8px; padding: 0.5rem 0.6rem; font: inherit; font-size: 0.85rem; background: #fff; }
textarea { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 0.75rem; line-height: 1.4; resize: vertical; }
.actions { display: flex; gap: 0.5rem; margin-top: 0.5rem; }
button { border: 1px solid #ccc; background: #fff; border-radius: 8px; padding: 0.5rem 0.9rem; cursor: pointer; font: inherit; }
button.primary { background: #111; color: #fff; border-color: #111; }
.fine { font-size: 0.75rem; color: #666; margin: 0.6rem 0 0; }
@media (max-width: 520px) { .row { grid-template-columns: 1fr; } }
</style>
