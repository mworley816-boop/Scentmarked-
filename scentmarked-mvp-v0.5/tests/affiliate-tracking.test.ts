import test from 'node:test'
import assert from 'node:assert/strict'
import { affiliateClickPayload } from '../lib/affiliate-tracking.ts'

test('affiliate click payload uses the database tracking field names',()=>{
 assert.deepEqual(
  affiliateClickPayload(42,'perfume-123','profile_featured'),
  {offer_id:42,perfume_id:'perfume-123',placement:'profile_featured'}
 )
})

test('affiliate click payload preserves the profile more placement',()=>{
 assert.deepEqual(
  affiliateClickPayload(7,'perfume-456','profile_more'),
  {offer_id:7,perfume_id:'perfume-456',placement:'profile_more'}
 )
})
