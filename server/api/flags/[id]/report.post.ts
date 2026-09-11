// POST /api/flags/:id/report — flag content for review. Hidden from the list after 3 reports.
export default defineEventHandler(async (event) => {
  const raw = decodeURIComponent(getRouterParam(event, 'id') ?? '')
  const [ward, service, id] = raw.split(':')
  if (!ward || !service || !id) throw createError({ statusCode: 400, statusMessage: 'Bad id' })
  const store = flagStore()
  const key = `${ward}:${service}:${id}`
  const flag = await store.getItem(key)
  if (!flag) throw createError({ statusCode: 404, statusMessage: 'Not found' })
  flag.reports = (flag.reports ?? 0) + 1
  await store.setItem(key, flag)
  return { ok: true, reports: flag.reports, hidden: flag.reports >= 3 }
})
