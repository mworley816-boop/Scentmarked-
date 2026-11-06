import test from 'node:test'
import assert from 'node:assert/strict'
import {createAtlasEvidenceCollector} from '../lib/atlas-evidence-collector.ts'
test('collects bounded source text from an explicitly trusted HTTPS host',async()=>{
 const collector=createAtlasEvidenceCollector({allowedHosts:['example.org'],fetchImpl:async()=>new Response('<html><script>ignore me</script><body>Official notes are vanilla, amber, and soft musk.</body></html>',{headers:{'content-type':'text/html'}}) as never})
 const records=await collector('p',['https://example.org/perfume'])
 assert.equal(records.length,1)
 assert.match(records[0].excerpt,/Official notes/)
 assert.doesNotMatch(records[0].excerpt,/ignore me/)
})
test('blocks other hosts and redirects without fetching destination',async()=>{
 let calls=0
 const collector=createAtlasEvidenceCollector({allowedHosts:['example.org'],fetchImpl:(async()=>{calls++;return Response.redirect('https://example.org/other',302)}) as typeof fetch})
 assert.deepEqual(await collector('p',['https://untrusted.org/x','http://example.org/x','https://example.org/x']),[])
 assert.equal(calls,1)
})
test('rejects oversized evidence without saving an excerpt',async()=>{
 const collector=createAtlasEvidenceCollector({allowedHosts:['example.org'],maxBytes:1024,fetchImpl:async()=>new Response('x'.repeat(2048),{headers:{'content-type':'text/plain'}}) as never})
 assert.deepEqual(await collector('p',['https://example.org/x']),[])
})
