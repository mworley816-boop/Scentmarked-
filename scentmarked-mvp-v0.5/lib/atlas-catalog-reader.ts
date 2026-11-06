import type {SupabaseClient} from '@supabase/supabase-js'
import type {AtlasSourceReader,AtlasSourceRecord} from './atlas-source-context-loader.ts'

// Server-only catalog reader. Source URLs in perfume_sources are references,
// not extracted page content. A separate evidence collector must supply excerpts.
export function createAtlasCatalogReader(
 client:Pick<SupabaseClient,'from'>,
 readEvidence:(perfumeId:string)=>Promise<AtlasSourceRecord[]>
):AtlasSourceReader{
 return {
  async getPerfume(id){
   const {data:perfume,error}=await client.from('perfumes').select('id,name,brand_id').eq('id',id).maybeSingle()
   if(error)throw new Error('Atlas catalog perfume lookup failed')
   if(!perfume)return null
   const {data:brand,error:brandError}=await client.from('brands').select('name').eq('id',perfume.brand_id).maybeSingle()
   if(brandError)throw new Error('Atlas catalog brand lookup failed')
   if(!brand?.name)return null
   return {id:perfume.id,brand:brand.name,perfumeName:perfume.name}
  },
  async getSources(id){
   const {data,error}=await client.from('perfume_sources').select('source_url').eq('perfume_id',id).limit(50)
   if(error)throw new Error('Atlas catalog source lookup failed')
   const allowed=new Set((data??[]).map(row=>row.source_url))
   const evidence=await readEvidence(id)
   if(!Array.isArray(evidence))throw new Error('Invalid Atlas evidence response')
   // An excerpt is usable only when independently collected and associated
   // with an existing catalog citation for this exact perfume.
   return evidence.filter(row=>row.perfumeId===id&&allowed.has(row.url)&&!!row.excerpt?.trim())
  }
 }
}
