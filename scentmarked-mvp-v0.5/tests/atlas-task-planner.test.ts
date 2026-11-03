import test from 'node:test'
import assert from 'node:assert/strict'
import {planAtlasTasks} from '../lib/atlas-task-planner.ts'

const incomplete={id:'p1',status:'published',description:null,image_url:null,perfume_notes:[],perfume_sources:[],perfume_image_provenance:[]}
test('Atlas assigns all missing catalog tasks with stable IDs and graphic approval',()=>{
 const tasks=planAtlasTasks([incomplete])
 assert.deepEqual(tasks.map(t=>t.kind),['research_description','verify_notes','verify_sources','research_graphic'])
 assert.equal(tasks.find(t=>t.kind==='research_graphic')?.requiresApproval,true)
 assert.equal(tasks.find(t=>t.kind==='verify_notes')?.requiresApproval,false)
 assert.equal(tasks[0].id,'p1:research_description')
})
test('Atlas never assigns archived perfumes or duplicates',()=>{
 assert.equal(planAtlasTasks([{...incomplete,status:'archived'},incomplete,incomplete]).length,4)
})
test('Existing image with no provenance requires rights review and approval',()=>{
 const tasks=planAtlasTasks([{...incomplete,description:'verified',image_url:'https://example.org/image.jpg',perfume_notes:[{note_id:'n'}],perfume_sources:[{id:'s'}]}])
 assert.deepEqual(tasks.map(t=>t.kind),['verify_image_rights'])
 assert.equal(tasks[0].requiresApproval,true)
})
test('Complete catalog records have no assignments',()=>{
 assert.deepEqual(planAtlasTasks([{...incomplete,description:'description',image_url:'https://example.org/image.jpg',perfume_notes:[{note_id:'n'}],perfume_sources:[{id:'s'}],perfume_image_provenance:[{perfume_id:'p1'}]}]),[])
})
