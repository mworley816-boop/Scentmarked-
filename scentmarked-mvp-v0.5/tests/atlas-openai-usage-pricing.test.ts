import test from 'node:test'
import assert from 'node:assert/strict'
import {calculateAtlasOpenAICostMicros} from '../lib/atlas-openai-usage-pricing.ts'
const rates={inputUsdMicrosPerMillion:1000000,cachedInputUsdMicrosPerMillion:250000,outputUsdMicrosPerMillion:4000000}
test('prices uncached, cached and output tokens with ceiling',()=>{
 assert.equal(calculateAtlasOpenAICostMicros({inputTokens:1000,cachedInputTokens:200,outputTokens:100,totalTokens:1100},rates),1250)
})
test('rounds nonzero fractions up to one micro USD',()=>{
 assert.equal(calculateAtlasOpenAICostMicros({inputTokens:1,cachedInputTokens:0,outputTokens:0,totalTokens:1},{inputUsdMicrosPerMillion:1,cachedInputUsdMicrosPerMillion:0,outputUsdMicrosPerMillion:0}),1)
})
test('rejects invalid rates, usage and overflow',()=>{
 const usage={inputTokens:1000,cachedInputTokens:0,outputTokens:0,totalTokens:1000}
 assert.throws(()=>calculateAtlasOpenAICostMicros(usage,{...rates,inputUsdMicrosPerMillion:-1}))
 assert.throws(()=>calculateAtlasOpenAICostMicros({...usage,totalTokens:999},rates))
 assert.throws(()=>calculateAtlasOpenAICostMicros({inputTokens:Number.MAX_SAFE_INTEGER,cachedInputTokens:0,outputTokens:0,totalTokens:Number.MAX_SAFE_INTEGER},{...rates,inputUsdMicrosPerMillion:Number.MAX_SAFE_INTEGER}))
})
