export type AliasSearchOption = { name: string; brand: string; aliases?: string[] }

/** Match an exact primary name, branded name, or alternate fragrance name. */
export function isExactPerfumeSearchMatch(option: AliasSearchOption, query: string): boolean {
  const normalized = query.trim().toLocaleLowerCase()
  if (!normalized) return false
  return option.name.toLocaleLowerCase() === normalized ||
    (option.brand + ' — ' + option.name).toLocaleLowerCase() === normalized ||
    (option.aliases || []).some(alias => alias.toLocaleLowerCase() === normalized)
}
