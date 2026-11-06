import test from 'node:test'
import assert from 'node:assert/strict'
import {parseAtlasOpenAIUsage} from '../lib/atlas-openai-usage.ts'

test('parses usage and cached input tokens',()=>{
 assert.deepEqual(parseAtlasOpenAIUsage({usage:{input_tokens:120,output_tokens:30,total_tokens:150,input_tokens_details:{cached_tokens:20}}}),{
  inputTokens:120,outputTokens:30,totalTokens:150,cachedInputTokens:20
 })
})
test('accepts absent optional cache details as zero',()=>{
 assert.equal(parseAtlasOpenAIUsage({usage:{input_tokens:10,output_tokens:5,total_tokens:15}}).cachedInputTokens,0)
})
test('rejects absent or inconsistent usage',()=>{
 for(const body of [{},{usage:null},{usage:{input_tokens:2,output_tokens:3,total_tokens:4}},{usage:{input_tokens:2,output_tokens:3,total_tokens:5,input_tokens_details:{cached_tokens:3}}},{usage:{input_tokens:-1,output_tokens:3,total_tokens:2}}]){
  assert.throws(()=>parseAtlasOpenAIUsage(body))
 }
})
