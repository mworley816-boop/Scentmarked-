import type {SupabaseClient} from '@supabase/supabase-js'
import {createAtlasCatalogReader} from './atlas-catalog-reader.ts'
import {createAtlasEvidenceCollector} from './atlas-evidence-collector.ts'
import {createAtlasSourceContextLoader} from './atlas-source-context-loader.ts'
import {createAtlasOpenAIResearchProvider} from './atlas-openai-research-provider.ts'
import {runAtlasResearchDraftWorker} from './atlas-research-draft-worker.ts'

// Explicit server-side composition only. No scheduler, public route or auto-publish.
// The caller must provide a service-role client, outbound network restrictions,
// an approved hostname allowlist and a bounded one-task invocation.
export function createAtlasControlledResearchPipeline(options:{
 client:SupabaseClient;
 apiKey:string;
 model:string;
 allowedHosts:readonly string[];
 sourceFetch?:typeof fetch;
 modelFetch?:typeof fetch;
}){
 if(!options.allowedHosts.length)throw new Error('Atlas source allowlist is required')
 const collect=createAtlasEvidenceCollector({
  allowedHosts:options.allowedHosts,
  fetchImpl:options.sourceFetch
 })
 const reader=createAtlasCatalogReader(options.client,async perfumeId=>{
  const {data,error}=await options.client.from('perfume_sources')
   .select('source_url').eq('perfume_id',perfumeId).limit(8)
  if(error)throw new Error('Atlas source lookup failed')
  const urls=(data??[]).map(row=>row.source_url).filter((url):url is string=>typeof url==='string')
  return collect(perfumeId,urls)
 })
 const research=createAtlasOpenAIResearchProvider({
  apiKey:options.apiKey,
  model:options.model,
  loadContext:createAtlasSourceContextLoader(reader),
  fetchImpl:options.modelFetch
 })
 return ()=>runAtlasResearchDraftWorker(options.client,research)
}
