export const WARDS = ['k-east'] as const
export const SERVICES = ['swm', 'roads', 'swd', 'health', 'parks', 'markets'] as const

export interface Flag {
  id: string
  ward: string
  service: string
  note: string
  photo?: string // data URL, jpeg, small
  ts: number
}

export const flagStore = () => useStorage<Flag>('flags')
