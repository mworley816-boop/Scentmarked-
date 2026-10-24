import test from 'node:test'
import assert from 'node:assert/strict'
import { isOnboardingCompletion } from '../lib/onboarding-intent.ts'

test('only the exact onboarding completion destination can apply pending preferences',()=>{
 assert.equal(isOnboardingCompletion('/matches?profile=ready'),true)
 for(const destination of ['/matches','/matches?profile=ready&next=/collection','/matches?next=/collection&profile=ready','/matches?profile=ready#other','/reset-password','/collection','/matches?profile=ready%26x=y','//example.com/matches?profile=ready']){
  assert.equal(isOnboardingCompletion(destination),false,destination)
 }
})
