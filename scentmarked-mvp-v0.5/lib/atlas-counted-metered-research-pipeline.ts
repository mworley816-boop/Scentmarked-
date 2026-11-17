import {createAtlasControlledMeteredResearchPipeline} from './atlas-controlled-research-pipeline.ts'
import {createAtlasOpenAIInputTokenCounter} from './atlas-openai-input-token-counter.ts'

// Explicit server-side composition. Does not invoke the worker, count tokens,
// send model requests, install a scheduler, or enable publishing.
type PipelineOptions=Parameters<typeof createAtlasControlledMeteredResearchPipeline>[0]
type CountedOptions=Omit<PipelineOptions,'countInputTokens'|'tokenCounterModel'> & {
 tokenCountFetch?:typeof fetch;
}
export function createAtlasCountedMeteredResearchPipeline(options:CountedOptions){
 const countInputTokens=createAtlasOpenAIInputTokenCounter({
  apiKey:options.apiKey,model:options.model,fetchImpl:options.tokenCountFetch
 })
 return createAtlasControlledMeteredResearchPipeline({
  ...options,countInputTokens,tokenCounterModel:options.model
 })
}
