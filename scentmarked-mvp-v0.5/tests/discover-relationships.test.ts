import test from 'node:test'
import assert from 'node:assert/strict'
import { indexVisibleRelationships } from '../lib/discover-relationships.ts'

const relation=(source:string,target:string,type:string,confidence=60)=>({
 source_perfume_id:source,target_perfume_id:target,relationship_type:type,confidence
})

test('only indexes perfumes visible after sorting and pagination',()=>{
 const all=[relation('a','b','possible_clone'),relation('c','d','similar_dna')]
 const pageOne=indexVisibleRelationships(all,['c'])
 const pageTwo=indexVisibleRelationships(all,['a'])
 assert.deepEqual([...pageOne.keys()],['c'])
 assert.deepEqual([...pageTwo.keys()],['a'])
 assert.equal(pageOne.get('c')?.target_perfume_id,'d')
})

test('indexes both relationship directions for visible fragrances',()=>{
 const results=indexVisibleRelationships([relation('a','b','possible_clone')],['a','b'])
 assert.equal(results.get('a')?.relationship_type,'possible_clone')
 assert.equal(results.get('b')?.relationship_type,'possible_clone')
})

test('manufacturer evidence takes priority over higher confidence clone comparisons',()=>{
 const results=indexVisibleRelationships([
  relation('a','b','possible_clone',99),
  relation('a','c','manufacturer_inspired_by',40)
 ],['a'])
 assert.equal(results.get('a')?.target_perfume_id,'c')
})

test('confidence breaks ties within a relationship type',()=>{
 const results=indexVisibleRelationships([
  relation('a','b','similar_dna',45),
  relation('a','c','similar_dna',80)
 ],['a'])
 assert.equal(results.get('a')?.target_perfume_id,'c')
})

test('duplicate source and target does not duplicate the index',()=>{
 const results=indexVisibleRelationships([relation('a','a','flanker')],['a'])
 assert.equal(results.size,1)
})

test('does not create clone warnings for nonvisible fragrances',()=>{
 const results=indexVisibleRelationships([relation('a','b','possible_clone')],[])
 assert.equal(results.size,0)
})
