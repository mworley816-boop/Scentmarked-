export type AtlasTaskKind='research_description'|'verify_notes'|'verify_sources'|'research_graphic'|'verify_image_rights'
export type AtlasCatalogRecord={
 id:string;status:string;description:string|null;image_url:string|null;
 perfume_notes:{note_id:string}[]|null;perfume_sources:{id:string}[]|null;
 perfume_image_provenance:{perfume_id:string}[]|null
}
export type AtlasTask={id:string;perfumeId:string;kind:AtlasTaskKind;requiresApproval:boolean}
export function planAtlasTasks(records:AtlasCatalogRecord[]):AtlasTask[]{
 const tasks:AtlasTask[]=[]
 const seen=new Set<string>()
 for(const p of records){
  if(!p.id||seen.has(p.id)||p.status==='archived')continue
  seen.add(p.id)
  const add=(kind:AtlasTaskKind,requiresApproval=false)=>tasks.push({id:p.id+':'+kind,perfumeId:p.id,kind,requiresApproval})
  if(!p.description?.trim())add('research_description')
  if(!p.perfume_notes?.length)add('verify_notes')
  if(!p.perfume_sources?.length)add('verify_sources')
  if(!p.image_url)add('research_graphic',true)
  else if(!p.perfume_image_provenance?.length)add('verify_image_rights',true)
 }
 return tasks
}
export const atlasTaskLabels:Record<AtlasTaskKind,string>={
 research_description:'Research description',verify_notes:'Verify fragrance notes',
 verify_sources:'Find source evidence',research_graphic:'Research authentic product image',
 verify_image_rights:'Verify image rights'
}
