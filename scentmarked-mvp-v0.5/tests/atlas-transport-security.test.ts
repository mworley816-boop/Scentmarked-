import test from 'node:test'
import assert from 'node:assert/strict'
import {assessAtlasTransportSecurity} from '../lib/atlas-transport-security.ts'

const safe={pinnedResolvedIp:true,tlsHostnameVerified:true,redirectRevalidated:true,deadlineEnforced:true,streamedByteLimitEnforced:true}
test('requires all security guarantees',()=>{
 assert.deepEqual(assessAtlasTransportSecurity(safe),{ready:true,missing:[]})
 for(const key of Object.keys(safe) as (keyof typeof safe)[]){
  const result=assessAtlasTransportSecurity({...safe,[key]:false})
  assert.equal(result.ready,false,key)
  assert.ok(result.missing.includes(key))
 }
})
