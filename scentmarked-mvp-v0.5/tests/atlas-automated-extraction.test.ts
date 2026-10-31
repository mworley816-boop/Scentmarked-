import test from 'node:test'
import assert from 'node:assert/strict'
import {prepareAtlasAutomatedResearch} from '../lib/atlas-automated-extraction.ts'

test('automated extraction does not call network transport for unreviewed sources',async()=>{
 let called=false
 await assert.rejects(prepareAtlasAutomatedResearch({
  candidate:{brand:'Arabiyat Sugar',name:'Strawberry Tres Leches',manufacturerUrl:'https://example.com/perfume',sourceNotes:[]},
  transport:{retrieve:async()=>{called=true;throw new Error('Unexpected transport call')}}
 }),/not approved/)
 assert.equal(called,false)
})
