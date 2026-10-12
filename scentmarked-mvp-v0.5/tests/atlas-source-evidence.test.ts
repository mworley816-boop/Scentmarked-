import test from 'node:test'
import assert from 'node:assert/strict'
import {assessAtlasSourceEvidence,assessAtlasFetchTarget,assessAtlasRedirectTarget,isAllowedAtlasResolvedIp} from '../lib/atlas-source-evidence.ts'

const candidate={brand:'Arabiyat',name:'Example',manufacturerUrl:'https://manufacturer.example/perfume',sourceNotes:[]}
const evidence={manufacturerUrl:candidate.manufacturerUrl,observedUrl:candidate.manufacturerUrl,pageTitle:'Example fragrance',fetchedAt:new Date().toISOString()}

test('accepts consistent HTTPS evidence metadata without claiming manufacturer ownership',()=>{
 const result=assessAtlasSourceEvidence(candidate,evidence)
 assert.equal(result.metadataConsistent,true)
 assert.deepEqual(result.reasons,[])
})

test('flags mismatched observed host and missing title',()=>{
 const result=assessAtlasSourceEvidence(candidate,{...evidence,observedUrl:'https://unrelated.example/item',pageTitle:''})
 assert.equal(result.metadataConsistent,false)
 assert.ok(result.reasons.some(reason=>reason.includes('host')))
 assert.ok(result.reasons.some(reason=>reason.includes('title')))
})

test('rejects unsafe observed URL and invalid timestamp',()=>{
 const result=assessAtlasSourceEvidence(candidate,{...evidence,observedUrl:'http://manufacturer.example',fetchedAt:'not-a-date'})
 assert.equal(result.metadataConsistent,false)
 assert.ok(result.reasons.length>=2)
})

test('rejects local and IP-literal source hosts before automated fetching',()=>{
 for(const host of ['localhost','service.internal','127.0.0.1','[::1]','printer.local']){
  const url=`https://${host}/fragrance`
  const result=assessAtlasSourceEvidence({...candidate,manufacturerUrl:url},{...evidence,manufacturerUrl:url,observedUrl:url})
  assert.equal(result.metadataConsistent,false,`Expected ${host} to be rejected`)
  assert.ok(result.reasons.some(reason=>reason.includes('public domain')))
 }
})

test('preflight fetch policy permits public HTTPS names and blocks unsafe URL forms',()=>{
 assert.equal(assessAtlasFetchTarget('https://example.com/perfume').allowed,true)
 for(const url of ['http://example.com','https://localhost/test','https://127.0.0.1/test','https://[::1]/','https://example.com:8443/','https://user:pass@example.com/','https://example.com./','https://example.com/#fragment']){
  assert.equal(assessAtlasFetchTarget(url).allowed,false,`Expected rejection: ${url}`)
 }
})

test('redirect preflight validates relative links and rejects unsafe destinations',()=>{
 const good=assessAtlasRedirectTarget('https://example.com/fragrance','/new-fragrance')
 assert.equal(good.allowed,true)
 assert.equal(good.targetUrl,'https://example.com/new-fragrance')
 for(const location of ['http://example.com/item','https://localhost/item','https://127.0.0.1/item','https://example.com:8443/item','//[::1]/item']){
  const result=assessAtlasRedirectTarget('https://example.com/fragrance',location)
  assert.equal(result.allowed,false,`Expected rejection: ${location}`)
  assert.equal(result.targetUrl,null)
 }
 assert.equal(assessAtlasRedirectTarget('http://example.com','https://example.com').allowed,false)
})

test('resolved IP policy fails closed for private and unhandled addresses',()=>{
 for(const address of ['127.0.0.1','10.1.2.3','172.16.0.1','192.168.1.2','169.254.169.254','100.64.0.1','0.0.0.0','224.0.0.1','::1','fc00::1','::ffff:127.0.0.1','999.1.2.3']){
  assert.equal(isAllowedAtlasResolvedIp(address),false,address)
 }
 assert.equal(isAllowedAtlasResolvedIp('8.8.8.8'),true)
})

test('rejects observed manufacturer evidence from a different origin',()=>{
 const result=assessAtlasSourceEvidence(candidate,{...evidence,observedUrl:'https://manufacturer.example:8443/perfume'})
 assert.equal(result.metadataConsistent,false)
 assert.ok(result.reasons.some(reason=>reason.includes('origin')))
})
