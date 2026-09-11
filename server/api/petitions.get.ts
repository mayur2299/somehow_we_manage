// GET /api/petitions?ward=k-east
export default defineEventHandler(async (event) => {
  const { ward } = getQuery(event)
  if (typeof ward !== 'string' || !WARDS.includes(ward)) throw createError({ statusCode: 400, statusMessage: 'Unknown ward' })
  const store = petitionStore()
  const keys = await store.getKeys(ward)
  const items = (await Promise.all(keys.map(k => store.getItem(k)))).filter((p): p is Petition => !!p)
  items.sort((a, b) => b.signatures - a.signatures || b.ts - a.ts)
  return { petitions: items }
})
