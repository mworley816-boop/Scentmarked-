import test from 'node:test'
import assert from 'node:assert/strict'
import {assessAtlasManufacturerDomain} from '../lib/atlas-manufacturer-domain-registry.ts'

const registry=[{brand:'Arabiyat',hostname:'manufacturer.example.com'}]

test('approved brand and exact hostname allow HTTPS research',()=>{
 assert.equal(assessAtlasManufacturerDomain({brand:'Arabiyat',sourceUrl:'https://manufacturer.example.com/perfume',registry}).allowed,true)
})

test('unrelated brand cannot reuse an approved hostname',()=>{
 assert.equal(assessAtlasManufacturerDomain({brand:'Other Brand',sourceUrl:'https://manufacturer.example.com/perfume',registry}).allowed,false)
})

test('lookalike subdomains and parent domains cannot reuse approval',()=>{
 for(const hostname of ['evil.manufacturer.example.com','example.com','manufacturer.example.com.evil.test']){
  assert.equal(assessAtlasManufacturerDomain({brand:'Arabiyat',sourceUrl:'https://'+hostname+'/perfume',registry}).allowed,false)
 }
})

test('unsafe protocols and credential-bearing URLs cannot use approval',()=>{
 for(const sourceUrl of ['http://manufacturer.example.com/','https://user:pass@manufacturer.example.com/','https://manufacturer.example.com:8443/']){
  assert.equal(assessAtlasManufacturerDomain({brand:'Arabiyat',sourceUrl,registry}).allowed,false)
 }
})

test('wildcard and malformed registry hosts are never accepted',()=>{
 for(const hostname of ['*.example.com','-manufacturer.example.com','https://manufacturer.example.com']){
  assert.equal(assessAtlasManufacturerDomain({brand:'Arabiyat',sourceUrl:'https://manufacturer.example.com/',registry:[{brand:'Arabiyat',hostname}]}).allowed,false)
 }
})
