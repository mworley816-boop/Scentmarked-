import test from 'node:test'
import assert from 'node:assert/strict'
import { safeAuthNext } from '../lib/auth-redirect.ts'

test('safeAuthNext keeps safe local destinations',()=>{
 assert.equal(safeAuthNext('/collection'),'/collection')
 assert.equal(safeAuthNext('/onboarding?step=notes'),'/onboarding?step=notes')
 assert.equal(safeAuthNext('/matches#results'),'/matches#results')
})

test('safeAuthNext rejects external and protocol-relative destinations',()=>{
 assert.equal(safeAuthNext('https://example.com'),'/collection')
 assert.equal(safeAuthNext('//example.com/path'),'/collection')
 assert.equal(safeAuthNext('javascript:alert(1)'),'/collection')
})

test('safeAuthNext prevents auth and login redirect loops',()=>{
 assert.equal(safeAuthNext('/login'),'/collection')
 assert.equal(safeAuthNext('/login?message=ok'),'/collection')
 assert.equal(safeAuthNext('/auth'),'/collection')
 assert.equal(safeAuthNext('/auth/callback?next=/collection'),'/collection')
})

test('safeAuthNext supports a caller-provided fallback',()=>{
 assert.equal(safeAuthNext(null,'/onboarding'),'/onboarding')
 assert.equal(safeAuthNext('/auth/callback','/onboarding'),'/onboarding')
})
