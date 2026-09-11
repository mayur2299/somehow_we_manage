// GET /api/threads?q=Andheri+East — public Reddit search, cached 1h, snapshot fallback.
// Declared public API (rule 9). Reddit often blocks cloud IPs, hence the fallback.
import snapshot from '../data/threads-snapshot.json'

interface Thread { title: string; url: string; sub: string; score: number; comments: number; created: number }

export default defineEventHandler(async (event) => {
  const q = String(getQuery(event).q ?? 'Andheri East').slice(0, 80)
  const cache = useStorage<{ ts: number; items: Thread[] }>('cache')
  const key = `threads:${q.toLowerCase().replace(/\W+/g, '-')}`
  const hit = await cache.getItem(key)
  if (hit && Date.now() - hit.ts < 60 * 60 * 1000) return { source: 'reddit-cached', items: hit.items }

  try {
    const url = `https://www.reddit.com/r/mumbai/search.json?q=${encodeURIComponent(q)}&restrict_sr=1&sort=new&limit=12&t=year`
    const res = await $fetch<any>(url, { headers: { 'User-Agent': 'where-my-wards-money-goes/0.1 (hackathon; contact: omteam@radix.email)' }, timeout: 6000 })
    const items: Thread[] = (res?.data?.children ?? []).map((c: any) => ({
      title: c.data.title, url: `https://www.reddit.com${c.data.permalink}`, sub: c.data.subreddit,
      score: c.data.score, comments: c.data.num_comments, created: c.data.created_utc * 1000,
    }))
    if (items.length) { await cache.setItem(key, { ts: Date.now(), items }); return { source: 'reddit', items } }
  } catch { /* fall through */ }
  return { source: 'snapshot', items: (snapshot as Thread[]) }
})
