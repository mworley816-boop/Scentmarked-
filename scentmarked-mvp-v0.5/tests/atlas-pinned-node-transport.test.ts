import test from 'node:test'
import assert from 'node:assert/strict'
import {createAtlasPinnedNodeTransport} from '../lib/atlas-pinned-node-transport.ts'

const transport=createAtlasPinnedNodeTransport()

test('rejects localhost before a network connection is attempted',async()=>{
 await assert.rejects(transport.retrieve('https://localhost/private'),/destination rejected/)
})

test('rejects loopback IP targets',async()=>{
 await assert.rejects(transport.retrieve('https://127.0.0.1/private'),/destination rejected/)
})

test('rejects non-HTTPS target',async()=>{
 await assert.rejects(transport.retrieve('http://localhost/private'),/destination rejected/)
})
