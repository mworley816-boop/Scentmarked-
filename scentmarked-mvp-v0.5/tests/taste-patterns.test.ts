import test from 'node:test'
import assert from 'node:assert/strict'
import { learnedTastePatterns } from '../lib/taste-patterns.ts'
import type { MatchPerfume } from '../lib/match-scoring.ts'

const perfume=(id:string,notes:string[]=[],accords:Array<[string,number]>=[]):MatchPerfume=>({
 id,name:id,slug:id,perfume_notes:notes.map(name=>({position:'base',notes:{name}})),
 perfume_accords:accords.map(([name,strength])=>({strength,accords:{name}})),ratings:[]
})

test('repeated positive fragrance evidence rises to the top',()=>{
 const patterns=learnedTastePatterns([
  perfume('a',['Vanilla','Cherry'],[['Gourmand',90]]),
  perfume('b',['Vanilla'],[['Gourmand',80]])
 ],[])
 assert.equal(patterns[0].name,'Vanilla')
 assert.equal(patterns[0].positive,2)
 assert.ok(patterns.some(x=>x.name==='Gourmand'&&x.kind==='accord'))
})

test('negative fragrance evidence offsets contradictory positive patterns',()=>{
 const patterns=learnedTastePatterns([
  perfume('liked',['Vanilla','Rose'])
 ],[
  perfume('disliked',['Rose'])
 ])
 assert.ok(patterns.some(x=>x.name==='Vanilla'))
 assert.ok(!patterns.some(x=>x.name==='Rose'))
})

test('duplicate note rows in one perfume count as one evidence point',()=>{
 const p=perfume('duplicate',['Vanilla','Vanilla'])
 const patterns=learnedTastePatterns([p],[])
 assert.equal(patterns.find(x=>x.name==='Vanilla')?.positive,1)
})

test('limit caps displayed learned patterns',()=>{
 const patterns=learnedTastePatterns([perfume('a',['Vanilla','Cherry','Amber'])],[],2)
 assert.equal(patterns.length,2)
})


test('confidence grows from possible to emerging to strong with repeated evidence',()=>{
 const one=learnedTastePatterns([perfume('a',['Vanilla'])],[])
 const two=learnedTastePatterns([perfume('a',['Vanilla']),perfume('b',['Vanilla'])],[])
 const three=learnedTastePatterns([perfume('a',['Vanilla']),perfume('b',['Vanilla']),perfume('c',['Vanilla'])],[])
 assert.equal(one[0].confidence,'possible')
 assert.equal(two[0].confidence,'emerging')
 assert.equal(three[0].confidence,'strong')
})

test('contradictory evidence lowers confidence as well as net strength',()=>{
 const patterns=learnedTastePatterns([
  perfume('a',['Vanilla']),perfume('b',['Vanilla']),perfume('c',['Vanilla'])
 ],[perfume('d',['Vanilla'])])
 assert.equal(patterns[0].net,2)
 assert.equal(patterns[0].confidence,'strong')
 const mixed=learnedTastePatterns([perfume('a',['Rose']),perfume('b',['Rose'])],[perfume('c',['Rose'])])
 assert.equal(mixed[0].confidence,'emerging')
})
