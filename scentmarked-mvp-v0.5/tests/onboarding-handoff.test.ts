import test from 'node:test'
import assert from 'node:assert/strict'
import { applyOnboardingHandoff, decodeOnboardingHandoff, encodeOnboardingHandoff, type OnboardingHandoff } from '../lib/onboarding-handoff.ts'

const handoff: OnboardingHandoff = {
 loved: ['Vanilla'], avoided: ['Oud'], occasions: ['Everyday'], vibes: ['Cozy & Comforting'],
 presentations: ['Unisex / Gender-neutral'], favoriteIds: [], sweetness: 4, projection: 3,
 longevity: 5, budget: 100, marketingConsent: false
}

test('onboarding handoff round trips approved preference values', () => {
 assert.deepEqual(decodeOnboardingHandoff(encodeOnboardingHandoff(handoff)), handoff)
})

test('handoff decoder rejects malformed payloads', () => {
 assert.equal(decodeOnboardingHandoff('not-base64-json'), null)
 assert.equal(decodeOnboardingHandoff(null), null)
})

test('handoff decoder restricts untrusted preferences and consent', () => {
 const encoded = Buffer.from(JSON.stringify({
  ...handoff, loved: ['Vanilla', 'Injected', 'Vanilla'], presentations: ['No preference', 'Feminine-leaning'],
  sweetness: 99, budget: 999, marketingConsent: 'true'
 })).toString('base64url')
 const result = decodeOnboardingHandoff(encoded)
 assert.deepEqual(result?.loved, ['Vanilla'])
 assert.deepEqual(result?.presentations, ['No preference'])
 assert.equal(result?.sweetness, null)
 assert.equal(result?.budget, null)
 assert.equal(result?.marketingConsent, false)
})

function fakeSupabase(profile: {data?: unknown; error?: unknown}, revisionError: unknown = null) {
 const calls: Array<{table: string; operation: string; value?: unknown}> = []
 const client = {
  from(table: string) {
   return {
    update(value: unknown) {
     calls.push({table, operation: 'update', value})
     return {eq() {return {select() {return {async maybeSingle() {return {data: profile.data ?? null, error: profile.error ?? null}}}}}}}
    },
    insert(value: unknown) {
     calls.push({table, operation: 'insert', value})
     return Promise.resolve({error: revisionError})
    }
   }
  }
 }
 return {client, calls}
}

test('successful handoff updates owner profile and snapshots preferences', async () => {
 const {client,calls} = fakeSupabase({data:{id:'member-1'}})
 assert.equal(await applyOnboardingHandoff(client, 'member-1', handoff), true)
 assert.deepEqual(calls.map(c=>[c.table,c.operation]), [['profiles','update'],['taste_profile_revisions','insert']])
 assert.equal((calls[0].value as Record<string,unknown>).scent_profile_completed_at !== undefined, true)
})

test('missing profile row fails without recording a misleading revision', async () => {
 const {client,calls} = fakeSupabase({data:null})
 assert.equal(await applyOnboardingHandoff(client, 'member-1', handoff), false)
 assert.deepEqual(calls.map(c=>c.table), ['profiles'])
})

test('profile update database error fails without recording a revision', async () => {
 const {client,calls} = fakeSupabase({error:{code:'42501'}})
 assert.equal(await applyOnboardingHandoff(client, 'member-1', handoff), false)
 assert.deepEqual(calls.map(c=>c.table), ['profiles'])
})
