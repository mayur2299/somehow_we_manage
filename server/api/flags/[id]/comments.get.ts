// GET /api/flags/:id/comments  (id = "ward:service:flagId")
export default defineEventHandler(async (event) => {
  const raw = decodeURIComponent(getRouterParam(event, 'id') ?? '')
  const [ward, service, id] = raw.split(':')
  if (!ward || !service || !id) throw createError({ statusCode: 400, statusMessage: 'Bad id' })
  const store = commentStore()
  const keys = await store.getKeys(`${ward}:${id}`)
  const items = (await Promise.all(keys.map(k => store.getItem(k)))).filter((c): c is Comment => !!c)
  items.sort((a, b) => a.ts - b.ts)
  return { comments: items }
})
