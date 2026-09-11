// Seed the pilot ward with realistic complaints once, so the forum is never empty.
// Runs on cold start. Marker lives in the cache store. Photos are Wikimedia Commons URLs (credited).
import seed from '../data/seed.json'

export default defineNitroPlugin(async () => {
  try {
    const cache = useStorage<{ at: number }>('cache')
    const marker = `seeded:v${(seed as any).version}`
    if (await cache.getItem(marker)) return
    const flags = flagStore(), comments = commentStore(), petitions = petitionStore()
    for (const f of (seed as any).flags as any[]) await flags.setItem(`${f.ward}:${f.service}:${f.id}`, f)
    const wardOf = new Map<string, string>(((seed as any).flags as any[]).map(f => [f.id, f.ward]))
    for (const c of (seed as any).comments as any[]) await comments.setItem(`${wardOf.get(c.flagId) ?? 'k-east'}:${c.flagId}:${c.id}`, c)
    for (const p of (seed as any).petitions as any[]) await petitions.setItem(`${p.ward}:${p.id}`, p)
    await cache.setItem(marker, { at: Date.now() })
    console.log(`[seed] wrote ${(seed as any).flags.length} complaints across ${new Set(((seed as any).flags as any[]).map((f: any) => f.ward)).size} wards`)
  } catch (e) { console.error('[seed] failed', e) }
})
