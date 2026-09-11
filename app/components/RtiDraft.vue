<script setup lang="ts">
const props = defineProps<{
  wardCode: string
  wardName: string
  service: { label: string; be: number[]; actual: (number | null)[]; avgUtil: number }
  years: string[]
}>()
const name = ref('')
const address = ref('')
const status = ref('')

const sum = (a: (number | null)[]) => a.slice(0, 3).reduce((x, y) => (x ?? 0) + (y ?? 0), 0) as number
const cr = (n: number) => `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 2 })} crore`

const text = computed(() => {
  const yrs = `${props.years[0]} to ${props.years[2]}`
  const be = sum(props.service.be), ac = sum(props.service.actual), util = Math.round(props.service.avgUtil * 100)
  const svc = props.service.label.toLowerCase()
  return `To,
The Public Information Officer
Office of the Assistant Municipal Commissioner, ${props.wardCode} Ward
Municipal Corporation of Greater Mumbai

Subject: Application under Section 6(1) of the Right to Information Act, 2005 — expenditure on ${svc} in ${props.wardCode} (${props.wardName}) ward

Sir/Madam,

Published ward-wise budget figures show that for ${svc} in ${props.wardCode} ward, the budget estimate for ${yrs} was ${cr(be)} in total, while actual expenditure was ${cr(ac)}, i.e. about ${util}% of the estimate.

I request the following information for the years ${yrs}:

1. A list of all works undertaken under ${svc} in ${props.wardCode} ward, with location, sanctioned cost, name of contractor, work order date, contractual completion date and actual completion date.
2. The reasons for the difference between the budget estimate and the actual expenditure in each year, including any amounts booked to this ward by central departments.
3. For each work completed after its contractual completion date, the period of delay and the liquidated damages or penalty levied on the contractor, if any.
4. Copies of inspection or quality audit reports for these works, if any.

I am a citizen of India. The application fee of ₹10 is enclosed. If the information is held by another public authority, kindly transfer this application under Section 6(3).

Name: ${name.value || '____________________'}
Address: ${address.value || '____________________'}
Date: ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}

Signature: ____________________`
})

async function copy() {
  try { await navigator.clipboard.writeText(text.value); status.value = 'Copied. Bureaucracy, meet Ctrl+V.' }
  catch { status.value = 'Copy blocked by the browser. Select the text manually.' }
}
function download() {
  const blob = new Blob([text.value], { type: 'text/plain;charset=utf-8' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = `RTI-${props.wardCode.replace('/', '')}-${props.service.label.replace(/\s+/g, '-')}.txt`
  a.click(); URL.revokeObjectURL(a.href)
}
</script>

<template>
  <div class="rti">
    <p class="lead">We've already added your ward, service, allocation and expenditure figures. Add your name and address.</p>
    <div class="row">
      <input v-model="name" class="input" placeholder="Your name" />
      <input v-model="address" class="input" placeholder="Your address" />
    </div>
    <pre class="doc">{{ text }}</pre>
    <div class="actions">
      <button class="btn primary" type="button" @click="copy">Copy RTI</button>
      <button class="btn" type="button" @click="download">Download .txt</button>
      <a class="btn act" href="https://rtionline.maharashtra.gov.in/" target="_blank" rel="noopener">File on RTI Online →</a>
    </div>
    <p class="status" aria-live="polite">{{ status }}</p>
    <p class="fine">Paste into the Maharashtra RTI Online portal, or file at the ward office with a ₹10 court fee stamp. The BMC must answer within 30 days.</p>
  </div>
</template>

<style scoped>
.rti { display: grid; gap: 12px; }
.lead { font-weight: 800; margin: 0; }
.row { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.doc { white-space: pre-wrap; background: var(--white); border: 2px solid var(--ink); border-radius: 14px; padding: 16px; font-size: 14px; line-height: 1.45; max-height: 320px; overflow: auto; margin: 0; font-family: var(--body); }
.actions { display: flex; gap: 10px; flex-wrap: wrap; }
.status { font-weight: 900; min-height: 22px; margin: 0; }
.fine { font-size: 13px; font-weight: 600; margin: 0; }
@media (max-width: 520px) { .row { grid-template-columns: 1fr; } }
</style>
