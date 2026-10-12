import test from 'node:test'
import assert from 'node:assert/strict'
import {extractAtlasNoteSections} from '../lib/atlas-note-extraction.ts'

test('extracts explicitly labeled top heart and base notes',()=>{
 assert.deepEqual(extractAtlasNoteSections('Top Notes: Bergamot, Pear\nHeart Notes: Jasmine; Rose\nBase Notes: Amber, Musk'),{
  top:['Bergamot','Pear'],middle:['Jasmine','Rose'],base:['Amber','Musk']
 })
})
test('does not invent unlabeled notes',()=>{
 assert.deepEqual(extractAtlasNoteSections('A floral fragrance with jasmine, musk and vanilla.'),{top:[],middle:[],base:[]})
})
test('supports opening and drydown labels',()=>{
 const result=extractAtlasNoteSections('Opening Notes - Lemon, Apple\nDrydown Notes: Cedar, Vanilla')
 assert.deepEqual(result,{top:['Lemon','Apple'],middle:[],base:['Cedar','Vanilla']})
})
