export const FLAG_TAGS = [
  { key: 'not-started',  label: 'Not started',   hint: 'Budgeted, nothing on the ground' },
  { key: 'half-done',    label: 'Half done',     hint: 'Work stopped midway' },
  { key: 'poor-quality', label: 'Poor quality',  hint: 'Done, but already failing' },
  { key: 'abandoned',    label: 'Abandoned',     hint: 'Site left open or unsafe' },
  { key: 'never-existed',label: 'Never existed', hint: 'Cannot find this work at all' },
  { key: 'other',        label: 'Other',         hint: '' },
] as const
export type FlagTagKey = typeof FLAG_TAGS[number]['key']
export const tagLabel = (k?: string) => FLAG_TAGS.find(t => t.key === k)?.label ?? ''
