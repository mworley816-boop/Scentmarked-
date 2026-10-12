import test from 'node:test'
import assert from 'node:assert/strict'
import {assessAtlasFetchBudget,ATLAS_FETCH_TIMEOUT_MS} from '../lib/atlas-fetch-budget.ts'
import {ATLAS_MAX_REDIRECTS,ATLAS_MAX_SOURCE_BYTES} from '../lib/atlas-research-response-policy.ts'

test('accepts research within limits',()=>{
 assert.equal(assessAtlasFetchBudget({redirects:ATLAS_MAX_REDIRECTS,elapsedMs:100,receivedBytes:ATLAS_MAX_SOURCE_BYTES}).allowed,true)
})
test('rejects exceeded and malformed limits',()=>{
 const valid={redirects:0,elapsedMs:0,receivedBytes:0}
 for(const budget of [{...valid,redirects:ATLAS_MAX_REDIRECTS+1},{...valid,redirects:-1},{...valid,elapsedMs:ATLAS_FETCH_TIMEOUT_MS},{...valid,elapsedMs:Infinity},{...valid,receivedBytes:ATLAS_MAX_SOURCE_BYTES+1},{...valid,receivedBytes:-1}]){
  assert.equal(assessAtlasFetchBudget(budget).allowed,false,JSON.stringify(budget))
 }
})
