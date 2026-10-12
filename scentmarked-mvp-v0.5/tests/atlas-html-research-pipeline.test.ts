import test from 'node:test'
import assert from 'node:assert/strict'
import {prepareAtlasHtmlResearch} from '../lib/atlas-html-research-pipeline.ts'
const candidate={brand:'Example',name:'Rose',manufacturerUrl:'https://example.com/rose',sourceNotes:[]}
const base={candidate,sourceUrl:candidate.manufacturerUrl,capturedAt:new Date().toISOString(),response:{status:200,contentType:'text/html',contentLength:null}}
test('converts supplied HTML into pending-review notes',()=>{
 const result=prepareAtlasHtmlResearch({...base,html:'<title>Rose</title><p>Top Notes: Pear, Bergamot</p><p>Base Notes: Musk</p>'})
 assert.equal(result.pageTitle,'Rose')
 assert.equal(result.proposal.status,'needs_source_review')
 assert.deepEqual(result.queueCandidate.sourceNotes,['Top: Pear','Top: Bergamot','Base: Musk'])
})
test('rejects unsafe or uninformative HTML',()=>{
 assert.throws(()=>prepareAtlasHtmlResearch({...base,response:{...base.response,contentType:'application/pdf'},html:'<title>Rose</title>'}),/Invalid source response/)
 assert.throws(()=>prepareAtlasHtmlResearch({...base,html:'<title>Rose</title><p>Lovely fragrance</p>'}),/No explicitly labeled notes/)
 assert.throws(()=>prepareAtlasHtmlResearch({...base,html:'<title>Rose</title><script>Top Notes: Fake</script>'}),/No explicitly labeled notes/)
})
