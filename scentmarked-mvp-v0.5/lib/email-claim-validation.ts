export function validClaimIds(claimed:unknown):string[]|null{
  if(!Array.isArray(claimed))return null
  const ids=claimed.map(row=>row&&typeof row==='object'?(row as {delivery_id?:unknown}).delivery_id:undefined)
  if(ids.some(id=>typeof id!=='string'||!id.trim()||id!==id.trim()))return null
  if(new Set(ids).size!==ids.length)return null
  return ids as string[]
}
