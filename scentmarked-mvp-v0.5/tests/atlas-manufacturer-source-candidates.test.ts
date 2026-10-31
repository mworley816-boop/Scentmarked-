import test from 'node:test'
import assert from 'node:assert/strict'
import {ATLAS_MANUFACTURER_SOURCE_CANDIDATES} from '../lib/atlas-manufacturer-source-candidates.ts'
import {ATLAS_REVIEWED_MANUFACTURER_DOMAINS,assessAtlasAutomatedResearchSource} from '../lib/atlas-research-source-registry.ts'

test('Arabiyat research leads are not automatically approved',()=>{
 assert.ok(ATLAS_MANUFACTURER_SOURCE_CANDIDATES.length>=2)
 assert.ok(ATLAS_MANUFACTURER_SOURCE_CANDIDATES.every(x=>x.status==='needs-independent-review'))
 assert.equal(ATLAS_REVIEWED_MANUFACTURER_DOMAINS.length,0)
 for(const source of ATLAS_MANUFACTURER_SOURCE_CANDIDATES){
  assert.equal(assessAtlasAutomatedResearchSource(source.brand,'https://'+source.hostname+'/').allowed,false)
 }
})
