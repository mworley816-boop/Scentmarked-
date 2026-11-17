// Server-only OpenAI Responses input-token counting adapter.
// No inference call or scheduler is created here. Caller opts in explicitly.
export function createAtlasOpenAIInputTokenCounter(options:{
 apiKey:string;
 model:string;
 fetchImpl?:typeof fetch;
}){
 if(!options.apiKey?.trim()||!options.model?.trim())
  throw new Error('Atlas input token counter is not configured')
 return async(request:{model:string;instructions:string;input:string}):Promise<number>=>{
  if(request.model!==options.model)throw new Error('Atlas token counter model mismatch')
  if(typeof request.instructions!=='string'||typeof request.input!=='string')
   throw new Error('Atlas token counter input is invalid')
  const response=await (options.fetchImpl??fetch)('https://api.openai.com/v1/responses/input_tokens',{
   method:'POST',
   headers:{'content-type':'application/json',authorization:'Bearer '+options.apiKey},
   body:JSON.stringify({model:request.model,instructions:request.instructions,input:request.input}),
   signal:AbortSignal.timeout(15000)
  })
  if(!response.ok)throw new Error('Atlas input token count request failed ('+response.status+')')
  const result:unknown=await response.json()
  if(!result||typeof result!=='object')throw new Error('Atlas input token count response is invalid')
  const value=result as {object?:unknown;input_tokens?:unknown}
  if(value.object!=='response.input_tokens'||typeof value.input_tokens!=='number'||
   !Number.isSafeInteger(value.input_tokens)||value.input_tokens<0)
   throw new Error('Atlas input token count response is invalid')
  return value.input_tokens
 }
}
