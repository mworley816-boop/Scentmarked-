import test from 'node:test'
import assert from 'node:assert/strict'
import {assessAtlasDnsResolution} from '../lib/atlas-dns-resolution-policy.ts'

const url='https://example.com/perfume'
test('accepts only fully vetted public IPv4 resolution sets',()=>{
 assert.equal(assessAtlasDnsResolution(url,[{address:'8.8.8.8',family:4}]).allowed,true)
})
test('rejects empty, private, mixed, IPv6, and oversized resolution sets',()=>{
 assert.equal(assessAtlasDnsResolution(url,[]).allowed,false)
 assert.equal(assessAtlasDnsResolution(url,[{address:'8.8.8.8',family:4},{address:'127.0.0.1',family:4}]).allowed,false)
 assert.equal(assessAtlasDnsResolution(url,[{address:'::1',family:6}]).allowed,false)
 assert.equal(assessAtlasDnsResolution(url,Array.from({length:33},()=>({address:'8.8.8.8',family:4 as const}))).allowed,false)
 assert.equal(assessAtlasDnsResolution('https://localhost/',[{address:'8.8.8.8',family:4}]).allowed,false)
})
