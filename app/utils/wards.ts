import PIN from '~/data/pincodes.json'
const files = import.meta.glob('~/data/wards/*.json', { eager: true, import: 'default' }) as Record<string, any>

export const WARDS: Record<string, any> = Object.fromEntries(
  Object.entries(files)
    .map(([path, data]) => [path.split('/').pop()!.replace('.json', ''), data])
    .filter(([slug]) => slug !== 'index'),
)
export const WARD_INDEX: { slug: string; code: string; name: string; zone: string; pincodes: string[] }[] =
  (files[Object.keys(files).find(p => p.endsWith('index.json'))!] as any) ?? []

export const PINCODES = PIN as Record<string, [string, string]>
export function resolvePin(pin: string): { slug: string; area: string; ward: any } | null {
  const hit = PINCODES[pin]
  if (!hit) return null
  const ward = WARDS[hit[0]]
  return ward ? { slug: hit[0], area: hit[1], ward } : null
}
export const wardBySlug = (slug: string) => WARDS[slug] ?? null
export const DEFAULT_SLUG = 'k-east'
export const DEFAULT_PIN = '400069'
