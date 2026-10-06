import test from 'node:test'
import assert from 'node:assert/strict'
import { hasEntitlement, type MembershipState } from '../lib/membership-entitlements.ts'

const free:MembershipState={planSlug:'free',planName:'Free',status:'active',entitlements:['catalog','compare','community','basic_matches'],currentPeriodEnd:null,cancelAtPeriodEnd:false}

test('free membership keeps core discovery available',()=>{
 assert.equal(hasEntitlement(free,'catalog'),true)
 assert.equal(hasEntitlement(free,'compare'),true)
 assert.equal(hasEntitlement(free,'basic_matches'),true)
})
test('premium-only capabilities stay gated',()=>{
 assert.equal(hasEntitlement(free,'advanced_matches'),false)
 assert.equal(hasEntitlement(free,'taste_insights'),false)
 assert.equal(hasEntitlement(free,'deal_alerts'),false)
})
