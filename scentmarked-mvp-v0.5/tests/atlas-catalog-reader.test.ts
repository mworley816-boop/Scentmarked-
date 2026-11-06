import test from 'node:test'
import assert from 'node:assert/strict'
import {createAtlasCatalogReader} from '../lib/atlas-catalog-reader.ts'
const client={from(table:string){
 const rows:Record<string,unknown>={perfumes:{id:'p',name:'Scent',brand_id:'b'},brands:{name:'Brand'},perfume_sources:[{source_url:'https://example.org/scent'}]}
 const builder={select:()=>builder,eq:()=>builder,limit:async()=>({data:rows[table],error:null}),maybeSingle:async()=>({data:rows[table],error:null})}
 return builder
}}
test('reads catalog identity and accepts only catalog-linked evidence',async()=>{
 const reader=createAtlasCatalogReader(client as never,async()=>[
  {perfumeId:'p',url:'https://example.org/scent',excerpt:'Source excerpt'},
  {perfumeId:'p',url:'https://unlisted.example/scent',excerpt:'Unlisted'},
  {perfumeId:'other',url:'https://example.org/scent',excerpt:'Other perfume'}
 ])
 assert.deepEqual(await reader.getPerfume('p'),{id:'p',brand:'Brand',perfumeName:'Scent'})
 assert.deepEqual(await reader.getSources('p'),[{perfumeId:'p',url:'https://example.org/scent',excerpt:'Source excerpt'}])
})
test('catalog URLs alone do not manufacture evidence excerpts',async()=>{
 const reader=createAtlasCatalogReader(client as never,async()=>[])
 assert.deepEqual(await reader.getSources('p'),[])
})
