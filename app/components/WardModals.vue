<script setup lang="ts">
const props = defineProps<{ ward: any; posts: any[] }>()
const { receiptOpen, rtiOpen, service, receiptPost } = useWardModals()
const svc = computed(() => props.ward.services.find((s: any) => s.key === service.value) ?? props.ward.services[0])
const siteUrl = computed(() => (typeof location !== 'undefined' ? location.origin : 'https://somehow-we-manage.netlify.app'))
</script>

<template>
  <div>
    <div v-if="receiptOpen" class="modal" @click.self="receiptOpen = false">
      <div class="modal-card">
        <div class="modal-top">
          <div><span class="pill pink">The receipt</span><h3>{{ receiptPost ? 'Your complaint, as a card.' : 'Savage. Sourced. Shareable.' }}</h3></div>
          <button class="x" @click="receiptOpen = false" aria-label="Close">✕</button>
        </div>
        <div class="svc-tabs"><button v-for="s in ward.services" :key="s.key" class="pill" :class="{ ink: service === s.key }" @click="service = s.key">{{ s.icon }} {{ s.label }}</button></div>
        <Receipt :ward-code="ward.code" :ward-name="ward.name" :service="svc" :posts="posts" :site-url="siteUrl" :post="receiptPost" />
      </div>
    </div>
    <div v-if="rtiOpen" class="modal" @click.self="rtiOpen = false">
      <div class="modal-card">
        <div class="modal-top">
          <div><span class="pill green">Ready-to-file RTI</span><h3>Ask for the breakdown.</h3><p class="mini">{{ svc.icon }} {{ svc.label }} · {{ ward.code }} · {{ Math.round(svc.avgUtil * 100) }}% utilisation</p></div>
          <button class="x" @click="rtiOpen = false" aria-label="Close">✕</button>
        </div>
        <div class="svc-tabs"><button v-for="s in ward.services" :key="s.key" class="pill" :class="{ ink: service === s.key }" @click="service = s.key">{{ s.icon }} {{ s.label }}</button></div>
        <RtiDraft :ward-code="ward.code" :ward-name="ward.name" :service="svc" :years="ward.years" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.modal { position: fixed; inset: 0; background: rgba(17,17,17,.74); display: grid; place-items: center; padding: 20px; z-index: 99; }
.modal-card { background: var(--paper); border: 3px solid var(--ink); border-radius: 22px; padding: 22px; max-width: 780px; width: 100%; box-shadow: 10px 10px 0 var(--yellow); max-height: 92vh; overflow: auto; display: grid; gap: 14px; }
.modal-top { display: flex; justify-content: space-between; gap: 16px; align-items: start; }
.modal-top h3 { font-size: 32px; margin: 8px 0 4px; letter-spacing: -.05em; }
.x { border: 3px solid var(--ink); background: var(--white); border-radius: 10px; padding: 6px 10px; font-weight: 900; cursor: pointer; }
.svc-tabs { display: flex; flex-wrap: wrap; gap: 8px; }
.svc-tabs .pill { cursor: pointer; min-height: 36px; }
.mini { font-size: 12px; font-weight: 700; color: #3f3b34; margin: 0; }
</style>
