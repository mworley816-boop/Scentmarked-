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

test('same-position shared notes score higher than cross-position matches',()=>{
 const base=perfume({id:'base',perfume_notes:[{position:'base',notes:{name:'Vanilla'}}]})
 const samePosition=perfume({id:'same',perfume_notes:[{position:'base',notes:{name:'Vanilla'}}]})
 const differentPosition=perfume({id:'different',perfume_notes:[{position:'top',notes:{name:'Vanilla'}}]})
 const freq=new Map([['Vanilla',3]])
 const same=scentSimilarityScore(base,samePosition,freq,3)
 const different=scentSimilarityScore(base,differentPosition,freq,3)
 assert.ok(same.score>different.score)
 assert.deepEqual(same.positionMatches,['Vanilla'])
 assert.deepEqual(different.positionMatches,[])
})

test('relationship metadata does not increase recommendation score',()=>{
 const p=perfume({perfume_notes:[{position:'base',notes:{name:'Vanilla'}}]})
 const prefs={love:['vanilla'],avoid:[],sweetness:0,projection:0,longevity:0,maxPrice:0}
 const withoutRelationship=buildMatchCandidate(p,undefined,new Map(),1,prefs)
 const withRelationship=buildMatchCandidate(p,undefined,new Map(),1,prefs,{relationship_type:'possible_clone',confidence:95})
 assert.equal(withRelationship.score,withoutRelationship.score)
})

test('eligible candidates rank by score before loved-term tie breakers',()=>{
 const prefs={love:['vanilla'],avoid:[],sweetness:0,projection:0,longevity:0,maxPrice:0}
 const lower=buildMatchCandidate(perfume({id:'lower',perfume_notes:[{position:'top',notes:{name:'Vanilla'}}]}),undefined,new Map(),2,prefs)
 const higher={...buildMatchCandidate(perfume({id:'higher',perfume_notes:[{position:'base',notes:{name:'Vanilla'}}]}),undefined,new Map(),2,prefs),score:99}
 const ranked=rankMatchCandidates([lower,higher])
 assert.equal(ranked.matches[0].id,'higher')
})

test('blocked candidates never appear in ranked matches even with higher scores',()=>{
 const prefs={love:['vanilla'],avoid:['leather'],sweetness:0,projection:0,longevity:0,maxPrice:50}
 const eligible={...buildMatchCandidate(perfume({id:'eligible',price_low:40,perfume_notes:[{position:'base',notes:{name:'Vanilla'}}]}),undefined,new Map(),3,prefs),score:20}
 const avoided={...buildMatchCandidate(perfume({id:'avoided',price_low:40,perfume_notes:[{position:'base',notes:{name:'Vanilla'}},{position:'heart',notes:{name:'Leather'}}]}),undefined,new Map(),3,prefs),score:100}
 const overBudget={...buildMatchCandidate(perfume({id:'over-budget',price_low:90,perfume_notes:[{position:'base',notes:{name:'Vanilla'}}]}),undefined,new Map(),3,prefs),score:100}
 const ranked=rankMatchCandidates([avoided,overBudget,eligible])
 assert.deepEqual(ranked.matches.map(x=>x.id),['eligible'])
 assert.equal(ranked.avoidExcluded,1)
 assert.equal(ranked.budgetExcluded,1)
})

test('missing wear ratings do not penalize a recommendation',()=>{
 const p=perfume({id:'unrated',ratings:[]})
 const candidate=buildMatchCandidate(p,undefined,new Map(),1,{love:[],avoid:[],sweetness:5,projection:5,longevity:5,maxPrice:0})
 assert.equal(candidate.traitScore,null)
 assert.equal(candidate.score,0)
 assert.equal(candidate.scoreWeights.wear,0)
})

test('matching community wear ratings produce a strong wear-profile score',()=>{
 const p=perfume({id:'wear-match',ratings:[
  {sweetness:5,projection:4,longevity:5},
  {sweetness:5,projection:4,longevity:5}
 ]})
 const candidate=buildMatchCandidate(p,undefined,new Map(),1,{love:[],avoid:[],sweetness:5,projection:4,longevity:5,maxPrice:0})
 assert.equal(candidate.traitScore,100)
 assert.equal(candidate.score,100)
 assert.equal(candidate.scoreWeights.wear,1)
})

test('wear ratings outside the accepted one-to-five range are ignored',()=>{
 const p=perfume({id:'bad-ratings',ratings:[{sweetness:9,projection:0,longevity:-1}]})
 const candidate=buildMatchCandidate(p,undefined,new Map(),1,{love:[],avoid:[],sweetness:5,projection:5,longevity:5,maxPrice:0})
 assert.equal(candidate.traitScore,null)
})
