// Server-side only. Do not infer billable cost from missing usage metadata.
// Prices are configured separately and must be verified before enabling calls.
export type AtlasOpenAIUsage={
 inputTokens:number;
 outputTokens:number;
 totalTokens:number;
 cachedInputTokens:number;
}
function tokens(value:unknown,name:string):number{
 if(!Number.isSafeInteger(value)||typeof value!=='number'||value<0)
  throw new Error('Invalid Atlas OpenAI '+name)
 return value
}
export function parseAtlasOpenAIUsage(body:unknown):AtlasOpenAIUsage{
 if(!body||typeof body!=='object'||Array.isArray(body))
  throw new Error('Atlas OpenAI usage missing')
 const usage=(body as {usage?:unknown}).usage
 if(!usage||typeof usage!=='object'||Array.isArray(usage))
  throw new Error('Atlas OpenAI usage missing')
 const data=usage as Record<string,unknown>
 const inputTokens=tokens(data.input_tokens,'input tokens')
 const outputTokens=tokens(data.output_tokens,'output tokens')
 const totalTokens=tokens(data.total_tokens,'total tokens')
 const details=data.input_tokens_details
 let cachedInputTokens=0
 if(details!==undefined){
  if(!details||typeof details!=='object'||Array.isArray(details))
   throw new Error('Invalid Atlas OpenAI cached tokens')
  cachedInputTokens=tokens((details as Record<string,unknown>).cached_tokens,'cached tokens')
 }
 if(cachedInputTokens>inputTokens||totalTokens!==inputTokens+outputTokens)
  throw new Error('Inconsistent Atlas OpenAI usage')
 return {inputTokens,outputTokens,totalTokens,cachedInputTokens}
}
