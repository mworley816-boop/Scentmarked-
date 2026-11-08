import type {ClaimedTask} from './atlas-worker-execution.ts'
import type {AtlasEvidenceDraftInput} from './atlas-evidence-draft-writer.ts'
import type {AtlasOpenAIUsage} from './atlas-openai-usage.ts'
import type {AtlasModelRates} from './atlas-openai-usage-pricing.ts'
import {calculateAtlasOpenAICostMicros} from './atlas-openai-usage-pricing.ts'
import {createAtlasResearchBudgetGate,type AtlasResearchBudgetOptions} from './atlas-research-budget-gate.ts'

// Server-only adapter. A metered provider MUST report verified response usage.
// This adapter is not connected to any live worker or scheduler.
export function createAtlasMeteredResearchAdapter(options:{
 budget:AtlasResearchBudgetOptions;
 rates:AtlasModelRates;
 research:(task:ClaimedTask)=>Promise<{evidence:AtlasEvidenceDraftInput;usage:AtlasOpenAIUsage}>;
}){
 const gate=createAtlasResearchBudgetGate(options.budget)
 return (task:ClaimedTask):Promise<AtlasEvidenceDraftInput>=>gate(async()=>{
  const result=await options.research(task)
  const actualUsdMicros=calculateAtlasOpenAICostMicros(result.usage,options.rates)
  return {value:result.evidence,actualUsdMicros}
 })
}
