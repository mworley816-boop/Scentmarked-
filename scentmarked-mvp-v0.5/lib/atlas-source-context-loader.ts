import type {ClaimedTask} from './atlas-worker-execution.ts'
import type {AtlasResearchContext,AtlasSource} from './atlas-openai-research-provider.ts'

// A trusted source collector supplies previously retrieved, attributable text.
// No arbitrary URL fetches, scraping, browser access or model-generated sources.
export type AtlasCatalogIdentity={id:string;brand:string;perfumeName:string}
export type AtlasSourceRecord={perfumeId:string;url:string;excerpt:string;verified?:boolean}
export type AtlasSourceReader={
 getPerfume:(id:string)=>Promise<AtlasCatalogIdentity|null>
 getSources:(id:string)=>Promise<AtlasSourceRecord[]>
}
export function createAtlasSourceContextLoader(reader:AtlasSourceReader){
 return async(task:ClaimedTask):Promise<AtlasResearchContext>=>{
  const perfume=await reader.getPerfume(task.perfume_id)
  if(!perfume||perfume.id!==task.perfume_id||!perfume.brand?.trim()||!perfume.perfumeName?.trim())
   throw new Error('Atlas perfume identity is unavailable')
  const records=await reader.getSources(task.perfume_id)
  if(!Array.isArray(records))throw new Error('Invalid Atlas source records')
  const seen=new Set<string>()
  const sources:AtlasSource[]=[]
  for(const record of records){
   if(record.perfumeId!==task.perfume_id||record.verified===false)continue
   let url:URL
   try{url=new URL(record.url)}catch{continue}
   if(url.protocol!=='https:'||url.username||url.password||!url.hostname||!record.excerpt?.trim())continue
   const normalized=url.toString()
   if(seen.has(normalized))continue
   seen.add(normalized)
   sources.push({url:normalized,excerpt:record.excerpt.slice(0,3000)})
   if(sources.length===8)break
  }
  if(sources.length===0)throw new Error('No usable source excerpts for Atlas research')
  return {brand:perfume.brand.trim(),perfumeName:perfume.perfumeName.trim(),sources}
 }
}
