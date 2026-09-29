import test from 'node:test'
import assert from 'node:assert/strict'
import { affiliateClickPayload, validAffiliateUrl } from '../lib/affiliate-tracking.ts'

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


test('affiliate URL validation accepts HTTP and HTTPS destinations',()=>{
 assert.equal(validAffiliateUrl('https://shop.example.com/product?ref=scentmarked'),true)
 assert.equal(validAffiliateUrl('http://shop.example.com/product'),true)
})

test('affiliate URL validation rejects malformed and non-web destinations',()=>{
 assert.equal(validAffiliateUrl('not a url'),false)
 assert.equal(validAffiliateUrl('javascript:alert(1)'),false)
 assert.equal(validAffiliateUrl('mailto:shop@example.com'),false)
 assert.equal(validAffiliateUrl('ftp://example.com/product'),false)
})
