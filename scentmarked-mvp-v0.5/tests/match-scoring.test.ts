import test from 'node:test'
import assert from 'node:assert/strict'
import { buildMatchCandidate, rankMatchCandidates, feedbackAdjustment, personalSignalAdjustment, scentSimilarityScore, type MatchPerfume } from '../lib/match-scoring.ts'

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
 const lower={...buildMatchCandidate(perfume({id:'lower',perfume_notes:[{position:'top',notes:{name:'Vanilla'}}]}),undefined,new Map(),2,prefs),score:20}
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

test('selected-perfume recommendations normalize DNA preference and wear weights',()=>{
 const selected=perfume({id:'selected',perfume_notes:[{position:'base',notes:{name:'Vanilla'}}]})
 const p=perfume({
  id:'candidate',
  perfume_notes:[{position:'base',notes:{name:'Vanilla'}}],
  ratings:[{sweetness:5,projection:4,longevity:5}]
 })
 const candidate=buildMatchCandidate(p,selected,new Map([['Vanilla',2]]),2,{love:['vanilla'],avoid:[],sweetness:5,projection:4,longevity:5,maxPrice:0})
 const total=candidate.scoreWeights.dna+candidate.scoreWeights.preferences+candidate.scoreWeights.wear
 assert.ok(Math.abs(total-1)<1e-10)
 assert.ok(candidate.scoreWeights.dna>0)
 assert.ok(candidate.scoreWeights.preferences>0)
 assert.ok(candidate.scoreWeights.wear>0)
})

test('saved favorite similarity contributes a normalized scoring weight',()=>{
 const favorite=perfume({id:'favorite',perfume_notes:[{position:'base',notes:{name:'Vanilla'}}]})
 const candidate=buildMatchCandidate(perfume({id:'candidate',perfume_notes:[{position:'base',notes:{name:'Vanilla'}}]}),undefined,new Map([['Vanilla',2]]),2,{love:[],avoid:[],sweetness:0,projection:0,longevity:0,maxPrice:0,favoritePerfumes:[favorite]})
 const total=candidate.scoreWeights.dna+candidate.scoreWeights.preferences+candidate.scoreWeights.wear+candidate.scoreWeights.favorites
 assert.ok(candidate.favoriteTasteScore!=null)
 assert.ok(candidate.scoreWeights.favorites>0)
 assert.ok(Math.abs(total-1)<1e-10)
})

test('matching presentation adds four points but never exceeds 100',()=>{
 const prefs={love:['vanilla'],avoid:[],sweetness:0,projection:0,longevity:0,maxPrice:0,presentations:['Feminine-leaning']}
 const matching=buildMatchCandidate(perfume({id:'matching',gender_marketing:'Women',perfume_notes:[{position:'base',notes:{name:'Vanilla'}}]}),undefined,new Map(),2,prefs)
 const neutral=buildMatchCandidate(perfume({id:'neutral',gender_marketing:'Men',perfume_notes:[{position:'base',notes:{name:'Vanilla'}}]}),undefined,new Map(),2,prefs)
 assert.equal(matching.presentationMatched,true)
 assert.equal(neutral.presentationMatched,false)
 assert.equal(matching.score,Math.min(100,neutral.score+4))
})

test('selected perfume uses DNA as the full score when no other preference signal exists',()=>{
 const selected=perfume({id:'selected',perfume_notes:[{position:'base',notes:{name:'Vanilla'}}]})
 const p=perfume({id:'candidate',perfume_notes:[{position:'base',notes:{name:'Vanilla'}}]})
 const candidate=buildMatchCandidate(p,selected,new Map([['Vanilla',2]]),2,{love:[],avoid:[],sweetness:0,projection:0,longevity:0,maxPrice:0})
 assert.equal(candidate.score,candidate.dnaScore)
 assert.equal(candidate.scoreWeights.dna,1)
 assert.equal(candidate.scoreWeights.preferences,0)
 assert.equal(candidate.scoreWeights.wear,0)
})

test('sparse scent data keeps similarity confidence limited',()=>{
 const a=perfume({id:'a',perfume_notes:[{position:'base',notes:{name:'Vanilla'}}]})
 const b=perfume({id:'b',perfume_notes:[{position:'base',notes:{name:'Vanilla'}}]})
 const result=scentSimilarityScore(a,b,new Map([['Vanilla',2]]),2)
 assert.equal(result.confidence,'Limited')
})

test('rich shared note and accord data can produce high confidence',()=>{
 const notes=['Vanilla','Caramel','Musk','Amber','Rose','Bergamot'].map((name,i)=>({position:i<2?'top':i<4?'heart':'base',notes:{name}}))
 const accords=['Gourmand','Sweet','Warm','Vanilla'].map((name,i)=>({strength:100-i*10,accords:{name}}))
 const a=perfume({id:'a',perfume_notes:notes,perfume_accords:accords})
 const b=perfume({id:'b',perfume_notes:notes,perfume_accords:accords})
 const freq=new Map(notes.map(x=>[x.notes.name,2]))
 const result=scentSimilarityScore(a,b,freq,2)
 assert.equal(result.confidence,'High')
 assert.equal(result.usesAccords,true)
 assert.equal(result.sharedAccords.length,4)
})


test('recommendation feedback uses a bounded ranking adjustment',()=>{
 assert.equal(feedbackAdjustment('more_like_this'),5)
 assert.equal(feedbackAdjustment('less_like_this'),-5)
 assert.equal(feedbackAdjustment(null),0)
})

test('feedback can reorder close matches without changing their core scores',()=>{
 const lower={...buildMatchCandidate(perfume('lower',['Vanilla']),undefined,new Map(),2,{love:['Vanilla'],avoid:[],sweetness:0,projection:0,longevity:0,maxPrice:0}),score:78}
 const higher={...buildMatchCandidate(perfume('higher',['Vanilla']),undefined,new Map(),2,{love:['Vanilla'],avoid:[],sweetness:0,projection:0,longevity:0,maxPrice:0}),score:82}
 const ranked=rankMatchCandidates([higher,lower],12,{[higher.id]:'less_like_this',[lower.id]:'more_like_this'})
 assert.equal(ranked.matches[0].id,lower.id)
 assert.equal(lower.score,78)
 assert.equal(higher.score,82)
})


test('personal recommendation signals stay tightly bounded',()=>{
 assert.equal(personalSignalAdjustment({favorite:true,owned:true,want:true,rating:5}),3)
 assert.equal(personalSignalAdjustment({rating:1}),-2)
 assert.equal(personalSignalAdjustment({tried:true}),0)
 assert.equal(personalSignalAdjustment(),0)
})

test('personal signals can reorder close matches without changing core match scores',()=>{
 const prefs={love:['vanilla'],avoid:[],sweetness:0,projection:0,longevity:0,maxPrice:0}
 const lower={...buildMatchCandidate(perfume({id:'personal-lower',perfume_notes:[{position:'base',notes:{name:'Vanilla'}}]}),undefined,new Map(),2,prefs),score:80}
 const higher={...buildMatchCandidate(perfume({id:'personal-higher',perfume_notes:[{position:'base',notes:{name:'Vanilla'}}]}),undefined,new Map(),2,prefs),score:82}
 const ranked=rankMatchCandidates([higher,lower],12,{}, {[lower.id]:{favorite:true,rating:5}})
 assert.equal(ranked.matches[0].id,lower.id)
 assert.equal(lower.score,80)
 assert.equal(higher.score,82)
})

test('bounded personal signals cannot overpower a clearly stronger core match',()=>{
 const prefs={love:['vanilla'],avoid:[],sweetness:0,projection:0,longevity:0,maxPrice:0}
 const lower={...buildMatchCandidate(perfume({id:'bounded-lower'}),undefined,new Map(),2,prefs),score:70}
 const higher={...buildMatchCandidate(perfume({id:'bounded-higher'}),undefined,new Map(),2,prefs),score:85}
 const ranked=rankMatchCandidates([higher,lower],12,{}, {[lower.id]:{favorite:true,rating:5},[higher.id]:{rating:1}})
 assert.equal(ranked.matches[0].id,higher.id)
})
