import test from 'node:test'
import assert from 'node:assert/strict'
import { relationshipCopy, relationshipLabel, relationshipReason } from '../lib/scent-relationships.ts'

test('manufacturer inspiration is explicitly distinguished',()=>{
 assert.equal(relationshipLabel('manufacturer_inspired_by'),'Documented inspiration')
 assert.match(relationshipCopy('manufacturer_inspired_by','Example'),/manufacturer-documented inspiration/)
})

test('possible clone copy does not present community evidence as manufacturer confirmation',()=>{
 assert.equal(relationshipReason('possible_clone'),'Possible clone relationship')
 assert.match(relationshipCopy('possible_clone','Example'),/not the same as manufacturer confirmation/)
})

test('similar DNA explicitly says the fragrances are not necessarily duplicates',()=>{
 assert.equal(relationshipLabel('similar_dna'),'Similar scent DNA')
 assert.match(relationshipCopy('similar_dna','Example'),/does not mean they are duplicates/)
})

test('community comparisons fall back to neutral comparison language',()=>{
 assert.equal(relationshipLabel('community_comparison'),'Known scent comparison')
 assert.match(relationshipCopy('community_comparison','Example'),/comparison alone is not a clone claim/)
})

test('flankers are described as the same fragrance family rather than clones',()=>{
 assert.equal(relationshipLabel('flanker'),'Same fragrance family')
 assert.match(relationshipCopy('flanker','Example'),/same fragrance family/)
})
