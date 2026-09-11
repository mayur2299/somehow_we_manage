// GET /api/flags?ward=k-east — counts per service plus recent flags
export default defineEventHandler(async (event) => {
  const { ward } = getQuery(event)
  if (typeof ward !== 'string' || !WARDS.includes(ward)) {
    throw createError({ statusCode: 400, statusMessage: 'Unknown ward' })
  }
  const store = flagStore()
  const keys = await store.getKeys(ward)
  const stored = (await Promise.all(keys.map(k => store.getItem(k)))).filter((f): f is Flag => !!f)
  const byId = new Map<string, Flag>()
  for (const f of seedFlagsFor(ward)) byId.set(f.id, f as Flag)
  for (const f of stored) byId.set(f.id, f)          // live rows win
  const deleted = new Set(stored.filter(f => (f as any).deleted).map(f => f.id))
  const items = [...byId.values()].filter(f => (f.reports ?? 0) < 3 && !deleted.has(f.id) && !(f as any).deleted)
  items.sort((a, b) => b.ts - a.ts)
  for (const f of items) delete (f as any).secret
  const counts: Record<string, number> = {}
  for (const f of items) counts[f.service] = (counts[f.service] ?? 0) + 1
  return { counts, recent: items.slice(0, 30) }
})
