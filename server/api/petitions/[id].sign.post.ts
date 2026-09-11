// POST /api/petitions/:id/sign  (id = "ward:petitionId")
export default defineEventHandler(async (event) => {
  const raw = decodeURIComponent(getRouterParam(event, 'id') ?? '')
  const [ward, id] = raw.split(':')
  if (!ward || !id) throw createError({ statusCode: 400, statusMessage: 'Bad id' })
  const store = petitionStore()
  const key = `${ward}:${id}`
  const p = await store.getItem(key)
  if (!p) throw createError({ statusCode: 404, statusMessage: 'Not found' })
  p.signatures += 1
  await store.setItem(key, p)
  return { ok: true, signatures: p.signatures }
})
