// POST /api/flags/:id/like  (id = "ward:service:flagId")
export default defineEventHandler(async (event) => {
  const raw = decodeURIComponent(getRouterParam(event, 'id') ?? '')
  const [ward, service, id] = raw.split(':')
  if (!ward || !service || !id) throw createError({ statusCode: 400, statusMessage: 'Bad id' })
  const store = flagStore()
  const key = `${ward}:${service}:${id}`
  const flag = await store.getItem(key)
  if (!flag) throw createError({ statusCode: 404, statusMessage: 'Not found' })
  flag.likes = (flag.likes ?? 0) + 1
  await store.setItem(key, flag)
  return { ok: true, likes: flag.likes }
})
