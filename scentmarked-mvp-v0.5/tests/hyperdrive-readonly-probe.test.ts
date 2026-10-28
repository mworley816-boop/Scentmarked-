import test from 'node:test'
import assert from 'node:assert/strict'
import {probeHyperdriveConnection} from '../lib/hyperdrive-readonly-probe.ts'

test('fails closed without a configured executor',async()=>{
 assert.deepEqual(await probeHyperdriveConnection(),{ok:false,reason:'not_configured'})
})
test('only executes a read-only SELECT 1 probe',async()=>{
 const result=await probeHyperdriveConnection(async sql=>{
  assert.equal(sql,'select 1 as reachable')
  return {rows:[{reachable:1}]}
 })
 assert.deepEqual(result,{ok:true})
})
test('rejects unexpected database response',async()=>{
 assert.deepEqual(await probeHyperdriveConnection(async()=>({rows:[]})),{ok:false,reason:'unexpected_result'})
})
test('redacts connection errors',async()=>{
 const result=await probeHyperdriveConnection(async()=>{
  throw new Error('postgres://username:secret@example.test/db')
 })
 assert.deepEqual(result,{ok:false,reason:'connection_failed'})
 assert.equal(JSON.stringify(result).includes('secret'),false)
})
