import test from 'node:test'
import assert from 'node:assert/strict'
import {assessAtlasAutomationReadiness} from '../lib/atlas-automation-readiness.ts'

test('automation readiness is blocked until source verification and transport exist',()=>{
 const result=assessAtlasAutomationReadiness('Arabiyat Sugar','https://example.com/perfume')
 assert.equal(result.ready,false)
 assert.equal(result.reviewedDomainCount,0)
 assert.equal(result.checks.length,4)
})
