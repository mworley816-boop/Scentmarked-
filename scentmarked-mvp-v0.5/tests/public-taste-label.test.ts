import test from 'node:test'
import assert from 'node:assert/strict'
import { publicTasteLabel } from '../lib/public-taste-label.ts'

test('combines the first loved family and signature note',()=>{
 assert.equal(publicTasteLabel({scent_loved_notes:['Gourmand','Vanilla'],scent_sweetness:5}),'Gourmand · Vanilla')
})

test('uses family-only and note-only labels',()=>{
 assert.equal(publicTasteLabel({scent_loved_notes:['Fresh']}),'Fresh Lover')
 assert.equal(publicTasteLabel({scent_loved_notes:['Marshmallow']}),'Marshmallow Lover')
})

test('falls back to sweetness when loved tastes are empty',()=>{
 assert.equal(publicTasteLabel({scent_loved_notes:[],scent_sweetness:5}),'Sweet Scent Lover')
 assert.equal(publicTasteLabel({scent_loved_notes:[],scent_sweetness:3}),'Balanced Scent Lover')
 assert.equal(publicTasteLabel({scent_loved_notes:[],scent_sweetness:1}),'Low-Sweetness Scent Lover')
})

test('ignores duplicate and blank loved values',()=>{
 assert.equal(publicTasteLabel({scent_loved_notes:[' ','Fruity','Fruity','Peach']}),'Fruity · Peach')
})

test('returns no public label without usable taste data',()=>{
 assert.equal(publicTasteLabel({scent_loved_notes:[],scent_sweetness:null}),null)
 assert.equal(publicTasteLabel(null),null)
})
