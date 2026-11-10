import type {AtlasModelRates} from './atlas-openai-usage-pricing.ts'
import {calculateAtlasOpenAICostMicros} from './atlas-openai-usage-pricing.ts'

// Conservative preflight: all input tokens charged at the higher input tier.
// The caller must enforce both token ceilings BEFORE a billable request.
// This helper does not itself impose model token limits or enable requests.
export function calculateAtlasWorstCaseReserveMicros(options:{
 maxInputTokens:number;
 maxOutputTokens:number;
 rates:AtlasModelRates;
}):number{
 const {maxInputTokens,maxOutputTokens,rates}=options
 if(!Number.isSafeInteger(maxInputTokens)||maxInputTokens<=0||
  !Number.isSafeInteger(maxOutputTokens)||maxOutputTokens<=0)
  throw new Error('Invalid Atlas token ceilings')
 if(!Number.isSafeInteger(rates.inputUsdMicrosPerMillion)||
  !Number.isSafeInteger(rates.cachedInputUsdMicrosPerMillion)||
  !Number.isSafeInteger(rates.outputUsdMicrosPerMillion)||
  rates.inputUsdMicrosPerMillion<=0||rates.cachedInputUsdMicrosPerMillion<0||
  rates.outputUsdMicrosPerMillion<=0)
  throw new Error('Invalid Atlas paid model rates')
 const inputRate=Math.max(rates.inputUsdMicrosPerMillion,rates.cachedInputUsdMicrosPerMillion)
 if(maxInputTokens>Number.MAX_SAFE_INTEGER-maxOutputTokens)
  throw new Error('Atlas token ceiling overflow')
 return calculateAtlasOpenAICostMicros({
  inputTokens:maxInputTokens,outputTokens:maxOutputTokens,
  cachedInputTokens:0,totalTokens:maxInputTokens+maxOutputTokens
 },{...rates,inputUsdMicrosPerMillion:inputRate})
}
