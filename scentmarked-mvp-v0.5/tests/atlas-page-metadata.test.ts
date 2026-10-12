import test from 'node:test'
import assert from 'node:assert/strict'
import {extractAtlasPageMetadata} from '../lib/atlas-page-metadata.ts'

test('extracts source page title description and same-host canonical',()=>{
 const result=extractAtlasPageMetadata('<title>Rose &amp; Oud</title><meta name="description" content="Floral &amp; woody"><link rel="canonical" href="/rose">','https://example.com/old')
 assert.deepEqual(result,{title:'Rose & Oud',description:'Floral & woody',canonicalUrl:'https://example.com/rose'})
})
test('does not trust cross-host or insecure canonical URLs',()=>{
 const html='<title>Test</title><link rel="canonical" href="https://other.example/redirect">'
 assert.equal(extractAtlasPageMetadata(html,'https://example.com/p').canonicalUrl,null)
 assert.equal(extractAtlasPageMetadata('<title>Test</title><link rel="canonical" href="http://example.com/p">','https://example.com/p').canonicalUrl,null)
})
test('returns empty metadata when tags are absent',()=>{
 assert.deepEqual(extractAtlasPageMetadata('hello','https://example.com'),{title:'',description:null,canonicalUrl:null})
})
