import { WARDS, resolvePin, DEFAULT_SLUG } from '~/utils/wards'

export function useWardContext() {
  const route = useRoute()
  const slug = useState<string>('ward-slug', () => DEFAULT_SLUG)
  const pin = useState<string | null>('ward-pin', () => null)
  const area = useState<string>('ward-area', () => '')
  const ready = useState<boolean>('ward-ready', () => false)

  function apply(p: string) {
    const hit = resolvePin(p)
    if (!hit) return false
    slug.value = hit.slug; pin.value = p; area.value = hit.area; ready.value = true
    if (import.meta.client) { try { localStorage.setItem('wmwmg:pin', p) } catch {} }
    return true
  }
  function clear() {
    ready.value = false; pin.value = null; area.value = ''
    if (import.meta.client) { try { localStorage.removeItem('wmwmg:pin') } catch {} }
    navigateTo('/')
  }

  // 1. A pin in the URL resolves on server AND client, so SSR and hydration agree
  //    and shared deep links render the ward directly.
  const q = route.query.pin
  if (typeof q === 'string' && q && q !== pin.value) apply(q)

  // 2. A remembered pin is client-only, so it is applied after mount. Never during
  //    render, or the server and client would disagree and hydration would break.
  onMounted(() => {
    if (!ready.value) {
      try {
        const saved = localStorage.getItem('wmwmg:pin')
        if (saved && apply(saved)) return
      } catch {}
      if (route.path !== '/') navigateTo('/')
    }
  })

  const ward = computed(() => WARDS[slug.value])
  return { slug, pin, area, ready, ward, apply, clear }
}

export function useWardModals() {
  const receiptOpen = useState('m-receipt', () => false)
  const rtiOpen = useState('m-rti', () => false)
  const service = useState('m-service', () => '')
  const receiptPost = useState<any>('m-post', () => null)
  function openReceipt(k?: string, post?: any) { if (k) service.value = k; receiptPost.value = post ?? null; receiptOpen.value = true }
  function openRti(k?: string) { if (k) service.value = k; rtiOpen.value = true }
  return { receiptOpen, rtiOpen, service, receiptPost, openReceipt, openRti }
}
