<script setup lang="ts">
const props = defineProps<{ pincodes: { pin: string; area: string }[]; wardCode: string; wardName: string }>()
const pin = ref('')
const result = computed(() => {
  const v = pin.value.replace(/\D/g, '')
  if (v.length !== 6) return null
  const hit = props.pincodes.find(p => p.pin === v)
  return hit ? { ok: true, area: hit.area } : { ok: false }
})
</script>

<template>
  <div class="pl">
    <label for="pin">Which ward am I in? Enter your pincode</label>
    <div class="row">
      <input id="pin" v-model="pin" inputmode="numeric" maxlength="6" placeholder="4000__" />
      <span v-if="result?.ok" class="res ok">{{ result.area }} → <strong>{{ wardCode }} {{ wardName }}</strong>. This page is your ward.</span>
      <span v-else-if="result && !result.ok" class="res no">Not in {{ wardCode }}. The pilot covers Andheri East only; all 24 wards are next.</span>
      <span v-else class="res hint">Covers {{ pincodes.map(p => p.pin).join(', ') }}</span>
    </div>
  </div>
</template>

<style scoped>
.pl { background: #fff; border: 1px solid #e6e6e6; border-radius: 12px; padding: 0.8rem 0.9rem; margin: 0.75rem 0 0; }
label { display: block; font-size: 0.8rem; font-weight: 600; color: #555; margin-bottom: 0.4rem; }
.row { display: flex; gap: 0.7rem; align-items: center; flex-wrap: wrap; }
input { width: 7.5rem; font: inherit; font-size: 1.1rem; letter-spacing: 0.12em; padding: 0.45rem 0.6rem; border: 1px solid #ccc; border-radius: 8px; }
.res { font-size: 0.9rem; line-height: 1.4; }
.res.ok { color: #2b8a3e; } .res.no { color: #a61e1e; } .res.hint { color: #888; font-size: 0.8rem; }
</style>
