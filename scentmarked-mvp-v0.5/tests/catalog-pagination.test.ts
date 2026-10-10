import test from 'node:test'
import assert from 'node:assert/strict'
import { appendUniqueCatalogIds, hasDuplicateCatalogIds } from '../lib/catalog-pagination.ts'

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

test('incremental checks catch duplicates across batches',()=>{
 const seen=new Set<string>()
 assert.equal(appendUniqueCatalogIds(seen,[{id:'a'},{id:'b'}]),true)
 assert.equal(appendUniqueCatalogIds(seen,[{id:'c'}]),true)
 assert.equal(appendUniqueCatalogIds(seen,[{id:'b'}]),false)
})

test('incremental checks reject duplicates within a single batch',()=>{
 assert.equal(appendUniqueCatalogIds(new Set<string>(),[{id:'x'},{id:'x'}]),false)
})

test('incremental checks handle empty batches and invalid identifiers',()=>{
 const seen=new Set<string>()
 assert.equal(appendUniqueCatalogIds(seen,[]),true)
 assert.equal(appendUniqueCatalogIds(seen,[{id:''}]),false)
})

test('invalid batches leave the previously accepted IDs unchanged',()=>{
 const seen=new Set(['existing'])
 assert.equal(appendUniqueCatalogIds(seen,[{id:'new'},{id:'existing'}]),false)
 assert.deepEqual([...seen],['existing'])
 assert.equal(appendUniqueCatalogIds(seen,[{id:'x'},{id:'x'}]),false)
 assert.deepEqual([...seen],['existing'])
 assert.equal(appendUniqueCatalogIds(seen,[{id:'new'}]),true)
})

test('invalid identifiers in a batch do not mutate accepted IDs',()=>{
 const seen=new Set(['original'])
 assert.equal(appendUniqueCatalogIds(seen,[{id:'valid'},{id:null}]),false)
 assert.deepEqual([...seen],['original'])
 assert.equal(appendUniqueCatalogIds(seen,[{id:'valid'},{id:''}]),false)
 assert.deepEqual([...seen],['original'])
 assert.equal(appendUniqueCatalogIds(seen,[{id:'valid'}]),true)
 assert.deepEqual([...seen],['original','valid'])
})
