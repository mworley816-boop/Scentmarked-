import test from 'node:test'
import assert from 'node:assert/strict'
import {readAtlasBoundedHtml} from '../lib/atlas-research-stream.ts'

function source(chunks:number[][]):ReadableStream<Uint8Array>{
 return new ReadableStream({start(controller){for(const chunk of chunks)controller.enqueue(Uint8Array.from(chunk));controller.close()}})
}
test('reads valid UTF-8 across chunks',async()=>{
 const bytes=Array.from(new TextEncoder().encode('café'))
 assert.equal(await readAtlasBoundedHtml(source([bytes.slice(0,4),bytes.slice(4)])), 'café')
})
test('rejects oversized and invalid streams',async()=>{
 await assert.rejects(readAtlasBoundedHtml(source([[1,2],[3,4]]),3),/exceeds byte limit/)
 await assert.rejects(readAtlasBoundedHtml(source([[255]])),/encoded data|valid/i)
 await assert.rejects(readAtlasBoundedHtml(null),/Missing/)
 await assert.rejects(readAtlasBoundedHtml(source([]),0),/Invalid/)
})
