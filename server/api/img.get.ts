// GET /api/img?u=<https url> — same-origin image proxy for the receipt canvas.
// Only Wikimedia Commons is allowed; cached for a day.
const ALLOWED = ['upload.wikimedia.org', 'thumb.wikimedia.org']
export default defineEventHandler(async (event) => {
  const u = String(getQuery(event).u ?? '')
  let url: URL
  try { url = new URL(u) } catch { throw createError({ statusCode: 400, statusMessage: 'Bad url' }) }
  if (url.protocol !== 'https:' || !ALLOWED.includes(url.hostname)) throw createError({ statusCode: 403, statusMessage: 'Host not allowed' })
  const res = await fetch(url, { headers: { 'User-Agent': 'where-my-wards-money-goes/0.1 (hackathon; omteam@radix.email)' } })
  if (!res.ok) throw createError({ statusCode: 502, statusMessage: 'Upstream failed' })
  const buf = Buffer.from(await res.arrayBuffer())
  setHeader(event, 'Content-Type', res.headers.get('content-type') ?? 'image/jpeg')
  setHeader(event, 'Cache-Control', 'public, max-age=86400, s-maxage=86400')
  setHeader(event, 'Access-Control-Allow-Origin', '*')
  return buf
})
