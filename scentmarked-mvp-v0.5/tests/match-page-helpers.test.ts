import test from 'node:test'
import assert from 'node:assert/strict'
import { buildMatchCompareHref, buildMatchRecoveryHref, buildRecommendationCriteriaKey, uniqueRecommendationResultIds, matchReasons } from '../lib/match-page-helpers.ts'

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

test('empty recovery values explicitly override saved profile defaults',()=>{
 const href=buildMatchRecoveryHref({
  selectedSlug:undefined,love:[],avoid:[],sweetness:0,projection:0,longevity:0,maxPrice:0
 },'budget')
 const q=new URL(href,'https://scentmarked.test').searchParams
 assert.equal(q.get('love'),'')
 assert.equal(q.get('avoid'),'')
 assert.equal(q.get('sweetness'),'')
 assert.equal(q.get('projection'),'')
 assert.equal(q.get('longevity'),'')
 assert.equal(q.get('maxPrice'),'')
})

test('compare links preserve the selected perfume as side A',()=>{
 const href=buildMatchCompareHref('candidate-scent','selected-scent')
 const q=new URL(href,'https://scentmarked.test').searchParams
 assert.equal(q.get('a'),'selected-scent')
 assert.equal(q.get('b'),'candidate-scent')
})

test('compare links can start with only the recommendation candidate',()=>{
 const href=buildMatchCompareHref('candidate-scent')
 const q=new URL(href,'https://scentmarked.test').searchParams
 assert.equal(q.get('a'),'candidate-scent')
 assert.equal(q.has('b'),false)
})

test('match reasons prioritize relationship and preference evidence',()=>{
 const reasons=matchReasons({
  id:'p',name:'Perfume',slug:'perfume',perfume_notes:[],perfume_accords:[],
  dnaScore:80,score:85,scoreWeights:{dna:.45,preferences:.35,wear:.2,favorites:0},
  shared:['Vanilla'],positionMatches:['Vanilla'],sharedAccords:['Gourmand'],usesAccords:true,
  confidence:'High',loved:['vanilla'],lovedAccords:['gourmand'],avoided:[],
  preferenceScore:90,traitScore:90,favoriteTasteScore:null,presentationMatched:false,sweet:5,proj:4,long:5,price:40,priceKnown:true,priceOk:true,
  relationship:{relationship_type:'possible_clone'}
 },true)
 assert.deepEqual(reasons,['Possible clone relationship','Matches vanilla','Shared DNA: Gourmand'])
})

test('preference-only reasons do not imply shared DNA with a baseline perfume',()=>{
 const reasons=matchReasons({
  id:'p',name:'Perfume',slug:'perfume',perfume_notes:[],perfume_accords:[],
  dnaScore:0,score:90,scoreWeights:{dna:0,preferences:.65,wear:.35,favorites:0},
  shared:['Vanilla'],positionMatches:['Vanilla'],sharedAccords:['Gourmand'],usesAccords:true,
  confidence:'Limited',loved:['vanilla'],lovedAccords:['gourmand'],avoided:[],
  preferenceScore:90,traitScore:95,favoriteTasteScore:null,presentationMatched:false,sweet:5,proj:4,long:5,price:0,priceKnown:false,priceOk:true
 },false)
 assert.deepEqual(reasons,['Matches vanilla','Strong wear-profile fit'])
})


test('recommendation history keys ignore love and avoid term order',()=>{
 const a=buildRecommendationCriteriaKey(base)
 const b=buildRecommendationCriteriaKey({...base,love:['gourmand','vanilla'],avoid:['smoke','leather']})
 assert.equal(a,b)
})

test('recommendation history keys normalize whitespace, case, and duplicate terms',()=>{
 const a=buildRecommendationCriteriaKey(base)
 const b=buildRecommendationCriteriaKey({...base,love:[' Vanilla ','GOURMAND','vanilla'],avoid:['SMOKE',' leather ']})
 assert.equal(a,b)
})

test('recommendation history keys still distinguish meaningful preference changes',()=>{
 const a=buildRecommendationCriteriaKey(base)
 assert.notEqual(a,buildRecommendationCriteriaKey({...base,maxPrice:50}))
 assert.notEqual(a,buildRecommendationCriteriaKey({...base,sweetness:4}))
})


test('recommendation history result ids preserve rank order while removing duplicates and blanks',()=>{
 assert.deepEqual(uniqueRecommendationResultIds(['a','b','a','','c']),['a','b','c'])
})

test('recommendation history result ids respect the requested storage limit',()=>{
 assert.deepEqual(uniqueRecommendationResultIds(['a','b','c','d'],2),['a','b'])
})


test('recommendation history keys canonicalize presentation and favorite fragrance order',()=>{
 const a=buildRecommendationCriteriaKey({...base,presentations:['Unisex / Gender-neutral','Feminine-leaning'],favoritePerfumeIds:['B','A']})
 const b=buildRecommendationCriteriaKey({...base,presentations:[' feminine-leaning ','UNISEX / GENDER-NEUTRAL'],favoritePerfumeIds:['a','b','A']})
 assert.equal(a,b)
})

test('recommendation history keys distinguish presentation and favorite fragrance changes',()=>{
 const a=buildRecommendationCriteriaKey({...base,presentations:['Feminine-leaning'],favoritePerfumeIds:['a']})
 assert.notEqual(a,buildRecommendationCriteriaKey({...base,presentations:['Unisex / Gender-neutral'],favoritePerfumeIds:['a']}))
 assert.notEqual(a,buildRecommendationCriteriaKey({...base,presentations:['Feminine-leaning'],favoritePerfumeIds:['b']}))
})
