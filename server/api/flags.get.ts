// GET /api/flags?ward=k-east — counts per service plus recent flags
export default defineEventHandler(async (event) => {
  const { ward } = getQuery(event)
  if (typeof ward !== 'string' || !WARDS.includes(ward as any)) {
    throw createError({ statusCode: 400, statusMessage: 'Unknown ward' })
  }
  const store = flagStore()
  const keys = await store.getKeys(ward)
  const items = (await Promise.all(keys.map(k => store.getItem(k)))).filter((f): f is Flag => !!f && (f.reports ?? 0) < 3)
  items.sort((a, b) => b.ts - a.ts)
  const counts: Record<string, number> = {}
  for (const f of items) counts[f.service] = (counts[f.service] ?? 0) + 1
  return { counts, recent: items.slice(0, 30) }
})
