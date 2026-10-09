/**
 * Detects overlapping records returned by offset-based catalog pagination.
 * A duplicate means the loaded count cannot safely be treated as a catalog total.
 */
export function hasDuplicateCatalogIds(rows: ReadonlyArray<{id: unknown}>): boolean {
 const ids=new Set<string>()
 for(const row of rows){
  if(typeof row.id!=='string'||!row.id)return true
  if(ids.has(row.id))return true
  ids.add(row.id)
 }
 return false
}
