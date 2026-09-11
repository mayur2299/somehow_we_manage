import seed from '../data/seed.json'

const SEED_FLAGS = (seed as any).flags as any[]
const SEED_COMMENTS = (seed as any).comments as any[]
const SEED_PETITIONS = (seed as any).petitions as any[]

export const seedFlagsFor = (ward: string) => SEED_FLAGS.filter(f => f.ward === ward)
export const seedFlagById = (id: string) => SEED_FLAGS.find(f => f.id === id)
export const seedCommentsFor = (flagId: string) => SEED_COMMENTS.filter(c => c.flagId === flagId)
export const seedPetitionsFor = (ward: string) => SEED_PETITIONS.filter(p => p.ward === ward)
export const seedPetitionById = (id: string) => SEED_PETITIONS.find(p => p.id === id)

/** Copy a seed row into the live store the first time somebody interacts with it. */
export async function ensureFlag(ward: string, service: string, id: string) {
  const store = flagStore()
  const key = `${ward}:${service}:${id}`
  let f = await store.getItem(key)
  if (!f) {
    const s = seedFlagById(id)
    if (!s || s.ward !== ward || s.service !== service) return null
    f = { ...s }
    await store.setItem(key, f)
  }
  return f
}
export async function ensurePetition(ward: string, id: string) {
  const store = petitionStore()
  const key = `${ward}:${id}`
  let p = await store.getItem(key)
  if (!p) {
    const s = seedPetitionById(id)
    if (!s || s.ward !== ward) return null
    p = { ...s }
    await store.setItem(key, p)
  }
  return p
}
