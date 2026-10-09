import test from 'node:test'
import assert from 'node:assert/strict'
import { hasDuplicateCatalogIds } from '../lib/catalog-pagination.ts'

test('accepts empty and uniquely identified catalog pages',()=>{
 assert.equal(hasDuplicateCatalogIds([]),false)
 assert.equal(hasDuplicateCatalogIds([{id:'a'},{id:'b'},{id:'c'}]),false)
})

test('detects overlapping pages with duplicate perfume IDs',()=>{
 const firstPage=[{id:'a'},{id:'b'}]
 const secondPage=[{id:'b'},{id:'c'}]
 assert.equal(hasDuplicateCatalogIds([...firstPage,...secondPage]),true)
})

test('rejects invalid and missing identifiers instead of masking pagination issues',()=>{
 assert.equal(hasDuplicateCatalogIds([{id:null}]),true)
 assert.equal(hasDuplicateCatalogIds([{id:''}]),true)
 assert.equal(hasDuplicateCatalogIds([{id:undefined}]),true)
 assert.equal(hasDuplicateCatalogIds([{id:123}]),true)
})

test('does not treat case-distinct identifiers as the same value',()=>{
 assert.equal(hasDuplicateCatalogIds([{id:'ABC'},{id:'abc'}]),false)
})
