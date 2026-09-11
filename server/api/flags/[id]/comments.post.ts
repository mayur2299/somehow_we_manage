// POST /api/flags/:id/comments  { text }
export default defineEventHandler(async (event) => {
  const raw = decodeURIComponent(getRouterParam(event, 'id') ?? '')
  const [ward, service, id] = raw.split(':')
  if (!ward || !service || !id) throw createError({ statusCode: 400, statusMessage: 'Bad id' })
  const body = await readBody<{ text?: string }>(event)
  const text = String(body?.text ?? '').trim().slice(0, 400)
  if (text.length < 2) throw createError({ statusCode: 400, statusMessage: 'Write something' })
  const flags = flagStore()
  const fkey = `${ward}:${service}:${id}`
  const flag = await ensureFlag(ward, service, id)
  if (!flag) throw createError({ statusCode: 404, statusMessage: 'Post not found' })
  const ts = Date.now()
  const c: Comment = { id: `${ts}-${Math.random().toString(36).slice(2, 7)}`, flagId: id, text, ts }
  await commentStore().setItem(`${ward}:${id}:${c.id}`, c)
  flag.comments = (flag.comments ?? 0) + 1
  await flags.setItem(fkey, flag)
  return { ok: true, comment: c, comments: flag.comments }
})
