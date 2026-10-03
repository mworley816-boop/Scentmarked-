import test from 'node:test'
import assert from 'node:assert/strict'
import { hasScentProfileRankingSignal } from '../lib/scent-profile.ts'

const empty=()=>({loved:[],avoided:[],favoriteIds:[],presentations:[],sweetness:null,projection:null,longevity:null,budget:0})

test('blank and no-preference-only scent profiles are not complete ranking profiles',()=>{
 assert.equal(hasScentProfileRankingSignal(empty()),false)
 assert.equal(hasScentProfileRankingSignal({...empty(),presentations:['No preference']}),false)
})

test('each supported recommendation preference can complete a scent profile',()=>{
 assert.equal(hasScentProfileRankingSignal({...empty(),loved:['Vanilla']}),true)
 assert.equal(hasScentProfileRankingSignal({...empty(),avoided:['Leather']}),true)
 assert.equal(hasScentProfileRankingSignal({...empty(),favoriteIds:['favorite-id']}),true)
 assert.equal(hasScentProfileRankingSignal({...empty(),presentations:['Unisex / Gender-neutral']}),true)
 assert.equal(hasScentProfileRankingSignal({...empty(),sweetness:4}),true)
 assert.equal(hasScentProfileRankingSignal({...empty(),projection:3}),true)
 assert.equal(hasScentProfileRankingSignal({...empty(),longevity:5}),true)
 assert.equal(hasScentProfileRankingSignal({...empty(),budget:100}),true)
})
