import index from '../../app/data/wards/index.json'
export const WARD_SLUGS: string[] = (index as any[]).map(w => w.slug)
