import test from 'node:test'
import assert from 'node:assert/strict'
import {validClaimIds} from '../lib/email-claim-validation.ts'

test('valid claim IDs require unique, nonblank, unpadded strings',()=>{
  assert.deepEqual(validClaimIds([{delivery_id:'id-1'},{delivery_id:'id-2'}]),['id-1','id-2'])
  assert.deepEqual(validClaimIds([]),[])
  assert.equal(validClaimIds(null),null)
  assert.equal(validClaimIds({delivery_id:'id-1'}),null)
  assert.equal(validClaimIds([{delivery_id:'id-1'},{delivery_id:'id-1'}]),null)
  assert.equal(validClaimIds([{delivery_id:' id-1'}]),null)
  assert.equal(validClaimIds([{delivery_id:'id-1 '}]),null)
  assert.equal(validClaimIds([{delivery_id:''}]),null)
  assert.equal(validClaimIds([{delivery_id:42}]),null)
  assert.equal(validClaimIds([null]),null)
})
