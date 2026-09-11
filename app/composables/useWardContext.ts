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
    try { localStorage.setItem('wmwmg:pin', p) } catch {}
    return true
  }
  function clear() {
    ready.value = false; pin.value = null
    try { localStorage.removeItem('wmwmg:pin') } catch {}
    navigateTo('/')
  }
  // resolve the pin as early as possible, then redirect only if there is genuinely none
  const resolveNow = (redirectIfMissing: boolean) => {
    try {
      const q = (route.query.pin as string) || (import.meta.client ? new URLSearchParams(location.search).get('pin') : null)
      if (q && q !== pin.value) { apply(q); return }      // an explicit ?pin always wins
      if (ready.value) return
      const saved = import.meta.client ? localStorage.getItem('wmwmg:pin') : null
      const p = q || saved
      if (p && apply(p)) return
      if (redirectIfMissing && import.meta.client && route.path !== '/') navigateTo('/')
    } catch {}
  }
  if (import.meta.client) resolveNow(false)
  onMounted(() => resolveNow(true))
  const ward = computed(() => WARDS[slug.value])
  return { slug, pin, area, ready, ward, apply, clear }
}

// shared modal state so any page can open the receipt / RTI
export function useWardModals() {
  const receiptOpen = useState('m-receipt', () => false)
  const rtiOpen = useState('m-rti', () => false)
  const service = useState('m-service', () => 'swd')
  const receiptPost = useState<any>('m-post', () => null)
  function openReceipt(k?: string, post?: any) { if (k) service.value = k; receiptPost.value = post ?? null; receiptOpen.value = true }
  function openRti(k?: string) { if (k) service.value = k; rtiOpen.value = true }
  return { receiptOpen, rtiOpen, service, receiptPost, openReceipt, openRti }
}
