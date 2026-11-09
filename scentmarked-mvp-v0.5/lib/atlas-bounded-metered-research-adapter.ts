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
 return createAtlasMeteredResearchAdapter(options)
}
