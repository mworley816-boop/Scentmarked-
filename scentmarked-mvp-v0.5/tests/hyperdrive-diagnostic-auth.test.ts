import test from 'node:test'
import assert from 'node:assert/strict'
import {authorizeHyperdriveDiagnostic} from '../lib/hyperdrive-diagnostic-auth.ts'

const secret='a-secret-that-is-at-least-thirty-two-characters'
test('rejects missing and short server secrets',async()=>{
 assert.equal(await authorizeHyperdriveDiagnostic('Bearer anything',undefined),false)
 assert.equal(await authorizeHyperdriveDiagnostic('Bearer anything','short'),false)
})
test('requires exact Bearer header and matching secret',async()=>{
 assert.equal(await authorizeHyperdriveDiagnostic(null,secret),false)
 assert.equal(await authorizeHyperdriveDiagnostic(secret,secret),false)
 assert.equal(await authorizeHyperdriveDiagnostic('Bearer wrong',secret),false)
 assert.equal(await authorizeHyperdriveDiagnostic('Bearer '+secret,secret),true)
})
