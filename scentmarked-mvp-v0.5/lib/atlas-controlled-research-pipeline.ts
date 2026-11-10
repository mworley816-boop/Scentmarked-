import type {SupabaseClient} from '@supabase/supabase-js'
import {createAtlasCatalogReader} from './atlas-catalog-reader.ts'
import {createAtlasEvidenceCollector} from './atlas-evidence-collector.ts'
import {createAtlasSourceContextLoader} from './atlas-source-context-loader.ts'
import {createAtlasOpenAIResearchProvider,createAtlasMeteredOpenAIResearchProvider} from './atlas-openai-research-provider.ts'
import {createAtlasBoundedMeteredResearchAdapter} from './atlas-bounded-metered-research-adapter.ts'
import type {AtlasResearchBudgetOptions} from './atlas-research-budget-gate.ts'
import type {AtlasModelRates} from './atlas-openai-usage-pricing.ts'
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
 let invoked=false
 return ()=>{
  if(invoked)throw new Error('Atlas runner has already been invoked')
  invoked=true
  return runAtlasResearchDraftWorker(options.client,research)
 }
}

// Opt-in budget-controlled pipeline. Not exposed as a route or scheduled task.
// Source fetching occurs before budget reservation; only the model request is billable.
export function createAtlasControlledMeteredResearchPipeline(options:{
 client:SupabaseClient;
 apiKey:string;
 model:string;
 allowedHosts:readonly string[];
 budget:AtlasResearchBudgetOptions;
 rates:AtlasModelRates;
 maxInputTokens:number;
 maxOutputTokens:number;
 maxRequestBytes:number;
 sourceFetch?:typeof fetch;
 modelFetch?:typeof fetch;
}){
 if(!options.allowedHosts.length)throw new Error('Atlas source allowlist is required')
 const collect=createAtlasEvidenceCollector({
  allowedHosts:options.allowedHosts,fetchImpl:options.sourceFetch
 })
 const reader=createAtlasCatalogReader(options.client,async perfumeId=>{
  const {data,error}=await options.client.from('perfume_sources')
   .select('source_url').eq('perfume_id',perfumeId).limit(8)
  if(error)throw new Error('Atlas source lookup failed')
  const urls=(data??[]).map(row=>row.source_url).filter((url):url is string=>typeof url==='string')
  return collect(perfumeId,urls)
 })
 const research=createAtlasMeteredOpenAIResearchProvider({
  apiKey:options.apiKey,model:options.model,
  loadContext:createAtlasSourceContextLoader(reader),fetchImpl:options.modelFetch,
  maxOutputTokens:options.maxOutputTokens,
  maxRequestBytes:options.maxRequestBytes,
  maxInputTokens:options.maxInputTokens
 })
 const metered=createAtlasBoundedMeteredResearchAdapter({
  budget:options.budget,rates:options.rates,
  maxInputTokens:options.maxInputTokens,
  maxOutputTokens:options.maxOutputTokens,
  research
 })
 let invoked=false
 return ()=>{
  if(invoked)throw new Error('Atlas runner has already been invoked')
  invoked=true
  return runAtlasResearchDraftWorker(options.client,metered)
 }
}
