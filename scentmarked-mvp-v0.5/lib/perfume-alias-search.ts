export type AliasSearchOption = { name: string; brand: string; aliases?: string[] }

/** Normalize spacing and casing consistently for exact primary and alias matches. */
const normalizeSearchText = (value: string): string =>
  value.trim().replace(/\s+/g, ' ').toLocaleLowerCase()

/** Match an exact primary name, branded name, or alternate fragrance name. */
export function isExactPerfumeSearchMatch(option: AliasSearchOption, query: string): boolean {
  const normalized = normalizeSearchText(query)
  if (!normalized) return false
  return normalizeSearchText(option.name) === normalized ||
    normalizeSearchText(option.brand + ' — ' + option.name) === normalized ||
    normalizeSearchText(option.brand + ' - ' + option.name) === normalized ||
    normalizeSearchText(option.brand + ' ' + option.name) === normalized ||
    (option.aliases || []).some(alias => normalizeSearchText(alias) === normalized)
}
