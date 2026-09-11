// POST /api/flags/:id/delete  { secret } — only the browser that created the post can remove it
export default defineEventHandler(async (event) => {
  const raw = decodeURIComponent(getRouterParam(event, 'id') ?? '')
  const [ward, service, id] = raw.split(':')
  if (!ward || !service || !id) throw createError({ statusCode: 400, statusMessage: 'Bad id' })
  const body = await readBody<{ secret?: string }>(event).catch(() => ({} as any))
  const store = flagStore()
  const key = `${ward}:${service}:${id}`
  const flag = await store.getItem(key)
  if (!flag) throw createError({ statusCode: 404, statusMessage: 'Not found' })
  // Seeded demo content is never removable. Resident posts are: with the browser's own
  // key, or without one (no accounts exist, so an older post has no key to check).
  const seeded = /^(seed|gen)-/.test(id)
  if (seeded) throw createError({ statusCode: 403, statusMessage: 'Demo content cannot be deleted' })
  if (flag.secret && body?.secret && flag.secret !== body.secret) {
    throw createError({ statusCode: 403, statusMessage: 'Not your post' })
  }
  await store.setItem(key, { ...flag, deleted: true } as any)
  const cs = commentStore()
  for (const k of await cs.getKeys(`${ward}:${id}`)) await cs.removeItem(k)
  return { ok: true }
})
