import test from 'node:test'
import assert from 'node:assert/strict'
import { buildMatchCandidate, rankMatchCandidates, scentSimilarityScore, type MatchPerfume } from '../lib/match-scoring.ts'

const perfume=(overrides:Partial<MatchPerfume>={}):MatchPerfume=>({
 id:'p1',name:'Test Scent',slug:'test-scent',brands:{name:'Test House'},
 perfume_notes:[],perfume_accords:[],ratings:[],...overrides
})

test('exact shared notes produce a stronger similarity than unrelated notes',()=>{
 const base=perfume({id:'a',perfume_notes:[{position:'base',notes:{name:'Vanilla'}}]})
 const same=perfume({id:'b',perfume_notes:[{position:'base',notes:{name:'Vanilla'}}]})
 const other=perfume({id:'c',perfume_notes:[{position:'base',notes:{name:'Leather'}}]})
 const freq=new Map([['Vanilla',2],['Leather',1]])
 assert.ok(scentSimilarityScore(base,same,freq,3).score>scentSimilarityScore(base,other,freq,3).score)
})

test('avoid terms exclude candidates',()=>{
 const p=perfume({perfume_notes:[{position:'base',notes:{name:'Leather'}}]})
 const c=buildMatchCandidate(p,undefined,new Map(),1,{love:[],avoid:['leather'],sweetness:0,projection:0,longevity:0,maxPrice:0})
 const ranked=rankMatchCandidates([c])
 assert.equal(ranked.avoidExcluded,1)
 assert.equal(ranked.eligibleMatchCount,0)
})

test('known prices above budget are excluded but unknown prices remain eligible',()=>{
 const prefs={love:[],avoid:[],sweetness:0,projection:0,longevity:0,maxPrice:50}
 const expensive=buildMatchCandidate(perfume({id:'expensive',price_low:75}),undefined,new Map(),2,prefs)
 const unknown=buildMatchCandidate(perfume({id:'unknown'}),undefined,new Map(),2,prefs)
 const ranked=rankMatchCandidates([expensive,unknown])
 assert.equal(ranked.budgetExcluded,1)
 assert.equal(ranked.eligibleMatchCount,1)
 assert.equal(ranked.matches[0].id,'unknown')
})

test('preferred accords contribute to preference matching',()=>{
 const p=perfume({perfume_accords:[{strength:90,accords:{name:'Gourmand'}}]})
 const c=buildMatchCandidate(p,undefined,new Map(),1,{love:['gourmand'],avoid:[],sweetness:0,projection:0,longevity:0,maxPrice:0})
 assert.deepEqual(c.loved,['gourmand'])
 assert.deepEqual(c.lovedAccords,['gourmand'])
 assert.ok(c.preferenceScore>0)
})
