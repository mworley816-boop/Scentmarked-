import test from 'node:test'
import assert from 'node:assert/strict'
import {ATLAS_REVIEWED_MANUFACTURER_DOMAINS,assessAtlasAutomatedResearchSource} from '../lib/atlas-research-source-registry.ts'

test('automatic research fails closed until a trusted manufacturer registry is populated',()=>{
 assert.equal(ATLAS_REVIEWED_MANUFACTURER_DOMAINS.length,0)
 assert.equal(assessAtlasAutomatedResearchSource('Example House','https://example.com/fragrance').allowed,false)
})
test('invalid targets remain disallowed',()=>{
 assert.equal(assessAtlasAutomatedResearchSource('Example House','http://localhost/').allowed,false)
})
