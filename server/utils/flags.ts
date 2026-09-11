export const WARDS = ['k-east'] as const
export const SERVICES = ['swm', 'roads', 'swd', 'health', 'parks', 'markets'] as const
export const TAGS = ['not-started', 'half-done', 'poor-quality', 'abandoned', 'never-existed', 'other'] as const
export type Tag = typeof TAGS[number]

export interface Flag {
  id: string
  ward: string
  service: string
  note: string
  tag?: Tag
  photo?: string // data URL, jpeg, small
  ts: number
  likes?: number
  locality?: string
  comments?: number
  confirms?: number
  lastConfirmed?: number
  photos?: string[]
}

export interface Comment { id: string; flagId: string; text: string; ts: number }
export const commentStore = () => useStorage<Comment>('comments')

export const flagStore = () => useStorage<Flag>('flags')

export interface Petition {
  id: string
  ward: string
  service: string
  title: string
  demand: string
  signatures: number
  status: 'open' | 'sent' | 'answered'
  ts: number
  fromFlag?: string
}
export const petitionStore = () => useStorage<Petition>('petitions')
