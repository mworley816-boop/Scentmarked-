import test from 'node:test'
import assert from 'node:assert/strict'
import { buildMatchRecoveryHref } from '../lib/match-page-helpers.ts'

const base={
 selectedSlug:'lattafa-khamrah',
 love:['vanilla','gourmand'],
 avoid:['leather','smoke'],
 sweetness:5,
 projection:4,
 longevity:5,
 maxPrice:75
}

test('removing one avoid term preserves the rest of the recommendation profile',()=>{
 const href=buildMatchRecoveryHref(base,'avoid',0)
 const q=new URL(href,'https://scentmarked.test').searchParams
 assert.equal(q.get('perfume'),'lattafa-khamrah')
 assert.equal(q.get('love'),'vanilla, gourmand')
 assert.equal(q.get('avoid'),'smoke')
 assert.equal(q.get('maxPrice'),'75')
})

test('removing one loved term preserves the other loved terms and filters',()=>{
 const href=buildMatchRecoveryHref(base,'love',1)
 const q=new URL(href,'https://scentmarked.test').searchParams
 assert.equal(q.get('love'),'vanilla')
 assert.equal(q.get('avoid'),'leather, smoke')
 assert.equal(q.get('sweetness'),'5')
 assert.equal(q.get('projection'),'4')
 assert.equal(q.get('longevity'),'5')
})

test('removing budget only drops maxPrice',()=>{
 const href=buildMatchRecoveryHref(base,'budget')
 const q=new URL(href,'https://scentmarked.test').searchParams
 assert.equal(q.has('maxPrice'),false)
 assert.equal(q.get('love'),'vanilla, gourmand')
 assert.equal(q.get('avoid'),'leather, smoke')
 assert.equal(q.get('perfume'),'lattafa-khamrah')
})

test('empty optional preferences are omitted from recovery URLs',()=>{
 const href=buildMatchRecoveryHref({
  selectedSlug:undefined,love:[],avoid:[],sweetness:0,projection:0,longevity:0,maxPrice:0
 },'budget')
 assert.equal(href,'/matches?')
})
