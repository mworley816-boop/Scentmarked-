import test from 'node:test'
import assert from 'node:assert/strict'
import {assessAtlasResearchHop} from '../lib/atlas-research-hop-policy.ts'

const safe={resolvedAddresses:[{address:'8.8.8.8',family:4 as const}],budget:{redirects:0,elapsedMs:100,receivedBytes:0}}
test('permits vetted public HTTPS targets',()=>{
 const result=assessAtlasResearchHop({...safe,target:'https://example.com/item'})
 assert.equal(result.allowed,true)
 assert.equal(result.targetUrl,'https://example.com/item')
})
test('checks DNS and budgets on redirects',()=>{
 const result=assessAtlasResearchHop({...safe,previousUrl:'https://example.com/old',target:'/new',resolvedAddresses:[{address:'127.0.0.1',family:4 as const}]})
 assert.equal(result.allowed,false)
 assert.equal(result.targetUrl,null)
 assert.equal(assessAtlasResearchHop({...safe,previousUrl:'https://example.com/old',target:'http://example.com/new'}).allowed,false)
 assert.equal(assessAtlasResearchHop({...safe,target:'https://example.com',budget:{redirects:4,elapsedMs:100,receivedBytes:0}}).allowed,false)
})

test('allows same-origin redirect but rejects cross-origin redirect',()=>{
 const same=assessAtlasResearchHop({...safe,previousUrl:'https://example.com/old',target:'/new'})
 assert.equal(same.allowed,true)
 assert.equal(same.targetUrl,'https://example.com/new')
 const cross=assessAtlasResearchHop({...safe,previousUrl:'https://example.com/old',target:'https://other.example/new'})
 assert.equal(cross.allowed,false)
 assert.equal(cross.targetUrl,null)
 assert.ok(cross.reasons.some(reason=>reason.includes('same origin')))
})
