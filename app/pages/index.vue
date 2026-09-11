<script setup lang="ts">
import { WARDS, resolvePin, DEFAULT_SLUG, PINCODES } from '~/utils/wards'

const entered = ref(false)
const slug = ref(DEFAULT_SLUG)
const pinInfo = ref<{ pin: string; area: string } | null>(null)
const ward = computed(() => WARDS[slug.value])
const allPins = computed(() => Object.entries(PINCODES).map(([pin, v]) => ({ pin, area: v[1], slug: v[0] })))

function apply(pin: string) {
  const hit = resolvePin(pin)
  if (!hit) return false
  slug.value = hit.slug
  pinInfo.value = { pin, area: hit.area }
  entered.value = true
  return true
}
onMounted(() => {
  try {
    const q = new URLSearchParams(location.search).get('pin')
    const saved = localStorage.getItem('wmwmg:pin')
    const pin = q || saved
    if (pin && apply(pin)) localStorage.setItem('wmwmg:pin', pin)
  } catch {}
})
function onFound(p: { pin: string; area: string }) {
  apply(p.pin)
  try { localStorage.setItem('wmwmg:pin', p.pin) } catch {}
  window.scrollTo({ top: 0 })
}
function changePin() {
  entered.value = false
  pinInfo.value = null
  try { localStorage.removeItem('wmwmg:pin') } catch {}
}
</script>

<template>
  <div>
    <PinGate v-if="!entered" :pincodes="allPins" @found="onFound" />
    <WardDashboard v-else :key="slug" :ward="ward" :ward-slug="slug" :pin-info="pinInfo!" @change-pin="changePin" />
  </div>
</template>
