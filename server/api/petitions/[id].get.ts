// GET /api/petitions/:id  (id = petitionId; ward fixed to pilot for now)
export default defineEventHandler(async (event) => {
  const id = decodeURIComponent(getRouterParam(event, 'id') ?? '')
  const store = petitionStore()
  for (const ward of WARDS) {
    const p = await store.getItem(`${ward}:${id}`)
    if (p) return { petition: p }
  }
  throw createError({ statusCode: 404, statusMessage: 'Petition not found' })
})
