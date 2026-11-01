/** One canonical parser for Atlas-approved catalog note imports. */
export type AtlasImportNote={position:'top'|'heart'|'base';name:string}
export function parseAtlasImportNotes(entries:string[]):AtlasImportNote[]{
 const parsed:AtlasImportNote[]=[]
 const seen=new Set<string>()
 for(const entry of entries){
  const match=/^(Top|Heart|Base):\s*(.+)$/i.exec(entry)
  if(!match)throw new Error('Unsupported Atlas note label')
  const position=match[1].toLowerCase() as AtlasImportNote['position']
  const name=match[2].trim()
  if(!name||!/[a-z0-9]/i.test(name)||name.length>120)throw new Error('Invalid Atlas note name')
  const key=position+'|'+name.toLocaleLowerCase('en')
  if(seen.has(key))continue
  seen.add(key)
  parsed.push({position,name})
 }
 return parsed
}
