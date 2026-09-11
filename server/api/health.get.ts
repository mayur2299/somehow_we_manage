// GET /api/health — proves the server side works locally and on Netlify.
export default defineEventHandler(() => {
  return {
    ok: true,
    service: 'somehow-we-manage',
    time: new Date().toISOString(),
    runtime: process.env.NETLIFY ? 'netlify' : 'local',
  }
})
