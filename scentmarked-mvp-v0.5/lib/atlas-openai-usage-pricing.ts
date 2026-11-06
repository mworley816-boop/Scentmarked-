import type {AtlasOpenAIUsage} from './atlas-openai-usage.ts'

// Explicit per-million-token prices in USD micros. Rates must be approved
// for the exact provider/model before any billable research is enabled.
export type AtlasModelRates={
 inputUsdMicrosPerMillion:number;
 cachedInputUsdMicrosPerMillion:number;
 outputUsdMicrosPerMillion:number;
}
function validRate(value:number):boolean{
 return Number.isSafeInteger(value)&&value>=0
}
export function calculateAtlasOpenAICostMicros(
 usage:AtlasOpenAIUsage,rates:AtlasModelRates
):number{
 if(!validRate(rates.inputUsdMicrosPerMillion)||
  !validRate(rates.cachedInputUsdMicrosPerMillion)||
  !validRate(rates.outputUsdMicrosPerMillion))
  throw new Error('Invalid Atlas model price')
 for(const value of [usage.inputTokens,usage.outputTokens,usage.totalTokens,usage.cachedInputTokens]){
  if(!Number.isSafeInteger(value)||value<0)throw new Error('Invalid Atlas model usage')
 }
 if(usage.cachedInputTokens>usage.inputTokens||
  usage.totalTokens!==usage.inputTokens+usage.outputTokens)
  throw new Error('Inconsistent Atlas model usage')
 const uncached=usage.inputTokens-usage.cachedInputTokens
 // BigInt prevents loss of precision for large integer token/rate products.
 const numerator=BigInt(uncached)*BigInt(rates.inputUsdMicrosPerMillion)
  +BigInt(usage.cachedInputTokens)*BigInt(rates.cachedInputUsdMicrosPerMillion)
  +BigInt(usage.outputTokens)*BigInt(rates.outputUsdMicrosPerMillion)
 const rounded=(numerator+999999n)/1000000n
 if(rounded>BigInt(Number.MAX_SAFE_INTEGER))throw new Error('Atlas cost overflow')
 return Number(rounded)
}
