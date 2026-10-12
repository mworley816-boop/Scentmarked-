import test from 'node:test'
import assert from 'node:assert/strict'
import {assessAtlasManufacturerDomain} from '../lib/atlas-manufacturer-domain-registry.ts'

const registry=[{brand:'Example House',hostname:'example.com'}]
test('accepts only explicitly reviewed brand-host pair',()=>{
 assert.equal(assessAtlasManufacturerDomain({brand:'Example House',sourceUrl:'https://example.com/perfume',registry}).allowed,true)
 assert.equal(assessAtlasManufacturerDomain({brand:'Other House',sourceUrl:'https://example.com/perfume',registry}).allowed,false)
})
test('rejects deceptive subdomains and lookalikes',()=>{
 for(const host of ['example.com.evil.test','shop.example.com','example.org']){
  assert.equal(assessAtlasManufacturerDomain({brand:'Example House',sourceUrl:'https://'+host+'/',registry}).allowed,false)
 }
})
test('rejects insecure and private targets even when registry lists them',()=>{
 assert.equal(assessAtlasManufacturerDomain({brand:'Example House',sourceUrl:'http://example.com/',registry}).allowed,false)
 assert.equal(assessAtlasManufacturerDomain({brand:'Example House',sourceUrl:'https://localhost/',registry:[{brand:'Example House',hostname:'localhost'}]}).allowed,false)
})

test('rejects malformed registry entries rather than trusting wildcard or URL forms',()=>{
 for(const hostname of ['*.example.com','https://example.com','example.com/','example.com.','-example.com','example..com']){
  assert.equal(assessAtlasManufacturerDomain({brand:'Example House',sourceUrl:'https://example.com/',registry:[{brand:'Example House',hostname}]}).allowed,false)
 }
})
