// POST /api/flags — a resident says "I don't see this on the ground"
export default defineEventHandler(async (event) => {
  const body = await readBody<{ ward?: string; service?: string; note?: string; tag?: string; photo?: string; locality?: string; title?: string }>(event)
  const ward = String(body?.ward ?? '')
  const service = String(body?.service ?? '')
  const note = String(body?.note ?? '').trim().slice(0, 280)
  const photo = typeof body?.photo === 'string' ? body.photo : undefined
  const title = String(body?.title ?? '').trim().slice(0, 90) || undefined
  const locality = String(body?.locality ?? '').trim().slice(0, 60) || undefined
  const tag = typeof body?.tag === 'string' && TAGS.includes(body.tag as Tag) ? (body.tag as Tag) : undefined

  if (!WARDS.includes(ward as any)) throw createError({ statusCode: 400, statusMessage: 'Unknown ward' })
  if (!SERVICES.includes(service as any)) throw createError({ statusCode: 400, statusMessage: 'Unknown service' })
  if (!tag) throw createError({ statusCode: 400, statusMessage: 'Pick a tag' })
  if (!note && !photo) throw createError({ statusCode: 400, statusMessage: 'Add a note or a photo' })
  if (photo && (!photo.startsWith('data:image/jpeg;base64,') || photo.length > 700_000)) {
    throw createError({ statusCode: 413, statusMessage: 'Photo too large' })
  }

  const ts = Date.now()
  const flag: Flag = { id: `${ts}-${Math.random().toString(36).slice(2, 8)}`, ward, service, note, tag, photo, ts, likes: 0, locality, title }
  await flagStore().setItem(`${ward}:${service}:${flag.id}`, flag)
  return { ok: true, flag: { ...flag, photo: undefined } }
})
