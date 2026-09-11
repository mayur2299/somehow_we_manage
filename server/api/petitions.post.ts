// POST /api/petitions — create a petition for a ward service
export default defineEventHandler(async (event) => {
  const body = await readBody<{ ward?: string; service?: string; title?: string; demand?: string; fromFlag?: string }>(event)
  const ward = String(body?.ward ?? '')
  const service = String(body?.service ?? '')
  const title = String(body?.title ?? '').trim().slice(0, 120)
  const demand = String(body?.demand ?? '').trim().slice(0, 600)
  if (!WARDS.includes(ward)) throw createError({ statusCode: 400, statusMessage: 'Unknown ward' })
  if (!SERVICES.includes(service as any)) throw createError({ statusCode: 400, statusMessage: 'Unknown service' })
  if (title.length < 8) throw createError({ statusCode: 400, statusMessage: 'Give the petition a title' })
  if (demand.length < 20) throw createError({ statusCode: 400, statusMessage: 'Say what you are asking for' })
  const ts = Date.now()
  const p: Petition = { id: `${ts}-${Math.random().toString(36).slice(2, 8)}`, ward, service, title, demand, signatures: 1, status: 'open', ts, fromFlag: body?.fromFlag }
  await petitionStore().setItem(`${ward}:${p.id}`, p)
  return { ok: true, petition: p }
})
