import test from 'node:test'
import assert from 'node:assert/strict'
import {releasableClaimIds,validClaimIds} from '../lib/email-claim-validation.ts'

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

test('release IDs exclude malformed values and deduplicate valid claims',()=>{
  assert.deepEqual(releasableClaimIds([{delivery_id:'one'},{delivery_id:'one'},{delivery_id:'two'},{delivery_id:' two'},null,{delivery_id:5}]),['one','two'])
  assert.deepEqual(releasableClaimIds(null),[])
  assert.deepEqual(releasableClaimIds([]),[])
})
