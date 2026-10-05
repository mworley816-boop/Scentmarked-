const SCENT_FAMILIES = new Set([
  'gourmand','fruity','floral','fresh','citrus','woody','amber','spicy','musky','aquatic','green','smoky',
])

export type PublicTasteProfile = {
  scent_loved_notes?: string[] | null
  scent_sweetness?: number | null
}

const clean = (value: unknown) => typeof value === 'string' ? value.trim() : ''

export function publicTasteLabel(profile: PublicTasteProfile | null | undefined) {
  if (!profile) return null

  const loved = [...new Set((profile.scent_loved_notes || []).map(clean).filter(Boolean))]
  const family = loved.find((item) => SCENT_FAMILIES.has(item.toLocaleLowerCase()))
  const note = loved.find((item) => !SCENT_FAMILIES.has(item.toLocaleLowerCase()))

  if (family && note) return `${family} · ${note}`
  if (family) return `${family} Lover`
  if (note) return `${note} Lover`

  const sweetness = Number(profile.scent_sweetness)
  if (sweetness >= 4 && sweetness <= 5) return 'Sweet Scent Lover'
  if (sweetness >= 1 && sweetness <= 2) return 'Low-Sweetness Scent Lover'
  if (sweetness === 3) return 'Balanced Scent Lover'

  return null
}
