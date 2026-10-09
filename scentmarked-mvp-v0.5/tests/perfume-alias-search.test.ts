import test from 'node:test'
import assert from 'node:assert/strict'
import { isExactPerfumeSearchMatch } from '../lib/perfume-alias-search.ts'

const option = { name: 'Fakhar Men', brand: 'Lattafa', aliases: ['Fakhar Black', 'Fakhar Lattafa Men'] }

test('matches exact primary perfume name regardless of case', () => {
  assert.equal(isExactPerfumeSearchMatch(option, 'fakhar men'), true)
})

test('matches exact branded perfume name', () => {
  assert.equal(isExactPerfumeSearchMatch(option, 'Lattafa — Fakhar Men'), true)
})

test('matches exact alias with whitespace and case differences', () => {
  assert.equal(isExactPerfumeSearchMatch(option, '  FAKHAR BLACK  '), true)
})

test('does not mistake partial or unrelated names for exact matches', () => {
  assert.equal(isExactPerfumeSearchMatch(option, 'Fakhar'), false)
  assert.equal(isExactPerfumeSearchMatch(option, 'Fakhar Rose'), false)
  assert.equal(isExactPerfumeSearchMatch(option, ''), false)
})

test('handles options without aliases', () => {
  assert.equal(isExactPerfumeSearchMatch({name:'Nebras',brand:'Lattafa'}, 'Fakhar Black'), false)
})
