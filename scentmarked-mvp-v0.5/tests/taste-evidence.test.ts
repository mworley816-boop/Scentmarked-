import test from 'node:test'
import assert from 'node:assert/strict'
import { resolveLatestTasteEvidence } from '../lib/taste-evidence.ts'

test('newer positive evidence supersedes an older dislike',()=>{
 const result=resolveLatestTasteEvidence([
  {perfumeId:'p1',direction:'negative',updatedAt:'2026-01-01T00:00:00Z',priority:3},
  {perfumeId:'p1',direction:'positive',updatedAt:'2026-02-01T00:00:00Z',priority:2}
 ])
 assert.equal(result[0].direction,'positive')
})

test('newer dislike supersedes older positive evidence',()=>{
 const result=resolveLatestTasteEvidence([
  {perfumeId:'p1',direction:'positive',updatedAt:'2026-01-01T00:00:00Z',priority:3},
  {perfumeId:'p1',direction:'negative',updatedAt:'2026-02-01T00:00:00Z',priority:1}
 ])
 assert.equal(result[0].direction,'negative')
})

test('higher-priority evidence wins when timestamps match',()=>{
 const result=resolveLatestTasteEvidence([
  {perfumeId:'p1',direction:'negative',updatedAt:'2026-02-01T00:00:00Z',priority:1},
  {perfumeId:'p1',direction:'positive',updatedAt:'2026-02-01T00:00:00Z',priority:3}
 ])
 assert.equal(result[0].direction,'positive')
})

test('negative evidence wins exact ties conservatively',()=>{
 const result=resolveLatestTasteEvidence([
  {perfumeId:'p1',direction:'positive',updatedAt:'2026-02-01T00:00:00Z',priority:2},
  {perfumeId:'p1',direction:'negative',updatedAt:'2026-02-01T00:00:00Z',priority:2}
 ])
 assert.equal(result[0].direction,'negative')
})

test('resolved evidence is ordered newest first',()=>{
 const result=resolveLatestTasteEvidence([
  {perfumeId:'old',direction:'positive',updatedAt:'2026-01-01T00:00:00Z'},
  {perfumeId:'new',direction:'positive',updatedAt:'2026-03-01T00:00:00Z'}
 ])
 assert.deepEqual(result.map(x=>x.perfumeId),['new','old'])
})
