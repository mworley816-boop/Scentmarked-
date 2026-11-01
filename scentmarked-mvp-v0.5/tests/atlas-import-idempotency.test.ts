import {strict as assert} from 'node:assert'
import {test} from 'node:test'
import {atlasImportKey,isSameAtlasImport} from '../lib/atlas-import-idempotency.ts'

test('normalizes safe research IDs for retries',()=>{
 assert.equal(atlasImportKey('  atlas:abc-123  '),'atlas:abc-123')
 assert.equal(isSameAtlasImport('atlas:abc-123',' atlas:abc-123 '),true)
 assert.equal(isSameAtlasImport('atlas:abc-123','atlas:abc-124'),false)
})
test('rejects unsafe or empty research IDs',()=>{
 for(const value of ['', '  ', '../admin', 'abc/def', 'a'.repeat(161), 'hello world']){
  assert.throws(()=>atlasImportKey(value))
 }
})
