import {strict as assert} from 'node:assert'
import {test} from 'node:test'
import {parseAtlasImportNotes} from '../lib/atlas-catalog-import-notes'

test('preserves positions and note names',()=>{
 assert.deepEqual(parseAtlasImportNotes(['Top: Strawberry','Heart: Caramel','Base: Vanilla']),[
  {position:'top',name:'Strawberry'},{position:'heart',name:'Caramel'},{position:'base',name:'Vanilla'}])
})
test('deduplicates notes within the same position',()=>{
 assert.deepEqual(parseAtlasImportNotes(['Top: Strawberry','top: strawberry']),[{position:'top',name:'Strawberry'}])
})
test('rejects unlabeled notes and malformed note names',()=>{
 for(const entries of [['Strawberry'],['Middle: Milk'],['Top: !!!'],['Base: ']]){
  assert.throws(()=>parseAtlasImportNotes(entries))
 }
})
