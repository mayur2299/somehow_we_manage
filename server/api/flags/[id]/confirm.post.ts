// POST /api/flags/:id/confirm  { photo? }  — "Yes, I've seen it. Still there."
export default defineEventHandler(async (event) => {
  const raw = decodeURIComponent(getRouterParam(event, 'id') ?? '')
  const [ward, service, id] = raw.split(':')
  if (!ward || !service || !id) throw createError({ statusCode: 400, statusMessage: 'Bad id' })
  const body = await readBody<{ photo?: string }>(event).catch(() => ({} as any))
  const photo = typeof body?.photo === 'string' ? body.photo : undefined
  if (photo && (!photo.startsWith('data:image/jpeg;base64,') || photo.length > 700_000)) throw createError({ statusCode: 413, statusMessage: 'Photo too large' })
  const store = flagStore()
  const key = `${ward}:${service}:${id}`
  const flag = await ensureFlag(ward, service, id)
  if (!flag) throw createError({ statusCode: 404, statusMessage: 'Not found' })
  flag.confirms = (flag.confirms ?? 0) + 1
  flag.lastConfirmed = Date.now()
  if (photo) {
    flag.photos = [...(flag.photos ?? []), photo].slice(-6)
    if (!flag.photo) flag.photo = photo
  }
  await store.setItem(key, flag)
  return { ok: true, confirms: flag.confirms, lastConfirmed: flag.lastConfirmed, photos: (flag.photos ?? []).length }
})
