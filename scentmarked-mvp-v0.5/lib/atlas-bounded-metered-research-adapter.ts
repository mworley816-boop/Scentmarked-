import type {ClaimedTask} from './atlas-worker-execution.ts'
import type {AtlasEvidenceDraftInput} from './atlas-evidence-draft-writer.ts'
import type {AtlasOpenAIUsage} from './atlas-openai-usage.ts'
import type {AtlasModelRates} from './atlas-openai-usage-pricing.ts'
import type {AtlasResearchBudgetOptions} from './atlas-research-budget-gate.ts'
import {calculateAtlasWorstCaseReserveMicros} from './atlas-budget-reservation-bound.ts'
import {createAtlasMeteredResearchAdapter} from './atlas-metered-research-adapter.ts'

// This composition refuses to construct unless the pre-reserved amount
// covers the maximum model cost. Caller must enforce input/output token
// ceilings on the actual request before using this in production.
// Response usage is also checked, but post-response checks cannot undo costs.
export function createAtlasBoundedMeteredResearchAdapter(options:{
 budget:AtlasResearchBudgetOptions;
 rates:AtlasModelRates;
 maxInputTokens:number;
 maxOutputTokens:number;
 research:(task:ClaimedTask)=>Promise<{evidence:AtlasEvidenceDraftInput;usage:AtlasOpenAIUsage}>;
}){
 const required=calculateAtlasWorstCaseReserveMicros({
  maxInputTokens:options.maxInputTokens,
  maxOutputTokens:options.maxOutputTokens,
  rates:options.rates
 })
 if(options.budget.perRequestReserveUsdMicros<required)
  throw new Error('Atlas research reserve is below worst-case cost')
 return createAtlasMeteredResearchAdapter({
  ...options,
  research:async task=>{
   const result=await options.research(task)
   if(!result.usage||!Number.isSafeInteger(result.usage.inputTokens)||
    !Number.isSafeInteger(result.usage.outputTokens)||
    result.usage.inputTokens<0||result.usage.outputTokens<0||
    result.usage.inputTokens>options.maxInputTokens||
    result.usage.outputTokens>options.maxOutputTokens)
    throw new Error('Atlas research token usage exceeds configured ceiling')
   return result
  }
 })
}
