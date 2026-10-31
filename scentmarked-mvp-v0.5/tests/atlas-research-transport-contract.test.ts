import test from 'node:test'
import assert from 'node:assert/strict'
import {retrieveAtlasManufacturerHtml,type AtlasVettedTransport} from '../lib/atlas-research-transport-contract.ts'

const neverCalled:AtlasVettedTransport={retrieve:async()=>{throw new Error('Transport must not run')}}

test('unreviewed manufacturer URL never invokes transport',async()=>{
 await assert.rejects(retrieveAtlasManufacturerHtml({brand:'Arabiyat Sugar',url:'https://example.com/perfume'},neverCalled),/not approved/)
})

test('local network URL never invokes transport',async()=>{
 await assert.rejects(retrieveAtlasManufacturerHtml({brand:'Arabiyat Sugar',url:'http://localhost/private'},neverCalled),/not approved/)
})
