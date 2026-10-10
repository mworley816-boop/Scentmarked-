/**
 * Detects overlapping records returned by offset-based catalog pagination.
 * A duplicate means the loaded count cannot safely be treated as a catalog total.
 */
export function hasDuplicateCatalogIds(rows: ReadonlyArray<{id: unknown}>): boolean {
 const ids=new Set<string>()
 return !appendUniqueCatalogIds(ids,rows)
}

/** Validates one newly fetched page without rescanning earlier pages. */
export function appendUniqueCatalogIds(seen: Set<string>, rows: ReadonlyArray<{id: unknown}>): boolean {
 const pageIds=new Set<string>()
 for(const row of rows){
  if(typeof row?.id!=='string'||!row.id.trim()||seen.has(row.id)||pageIds.has(row.id))return false
  pageIds.add(row.id)
 }
 for(const id of pageIds)seen.add(id)
 return true
}
