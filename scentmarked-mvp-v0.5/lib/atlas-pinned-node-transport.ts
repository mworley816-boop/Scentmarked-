import {lookup as dnsLookup} from 'node:dns/promises'
import {request as httpsRequest} from 'node:https'
import {Readable} from 'node:stream'
import {assessAtlasResearchHop} from './atlas-research-hop-policy.ts'
import {assessAtlasResearchResponse,ATLAS_MAX_REDIRECTS} from './atlas-research-response-policy.ts'
import {ATLAS_FETCH_TIMEOUT_MS} from './atlas-fetch-budget.ts'
import type {AtlasVettedTransport} from './atlas-research-transport-contract.ts'

/** Node-only network adapter. Do not import in Cloudflare Workers or edge runtimes.
 * Each TLS connection uses a pinned, prevalidated DNS address while retaining
 * the original hostname for TLS certificate verification and SNI.
 */
export function createAtlasPinnedNodeTransport():AtlasVettedTransport{
 return {retrieve:async(initialUrl)=>{
  const started=Date.now()
  let current=initialUrl
  let previous:string|undefined
  for(let redirects=0;redirects<=ATLAS_MAX_REDIRECTS;redirects++){
   const host=new URL(current).hostname
   const addresses=await dnsLookup(host,{all:true,verbatim:true})
   const hop=assessAtlasResearchHop({
    previousUrl:previous,target:current,
    resolvedAddresses:addresses.map(({address,family})=>({address,family:family as 4|6})),
    budget:{redirects,elapsedMs:Date.now()-started,receivedBytes:0}
   })
   if(!hop.allowed||!hop.targetUrl)throw new Error('Atlas network destination rejected: '+hop.reasons.join('; '))
   const pinned=addresses[0].address
   const remaining=ATLAS_FETCH_TIMEOUT_MS-(Date.now()-started)
   if(remaining<=0)throw new Error('Atlas research deadline exceeded')
   const response=await new Promise<{status:number;headers:import('node:http').IncomingHttpHeaders;stream:import('node:http').IncomingMessage}>((resolve,reject)=>{
    const req=httpsRequest(hop.targetUrl!,{
     method:'GET',agent:false,
     lookup:(_hostname,_options,callback)=>callback(null,pinned,4),
     headers:{'accept':'text/html,application/xhtml+xml','user-agent':'ScentmarkedAtlasResearch/1.0'}
    },stream=>resolve({status:stream.statusCode??0,headers:stream.headers,stream}))
    req.setTimeout(remaining,()=>req.destroy(new Error('Atlas research deadline exceeded')))
    req.on('error',reject)
    req.end()
   })
   const location=response.headers.location
   if(response.status>=300&&response.status<400&&location){
    response.stream.destroy()
    if(redirects===ATLAS_MAX_REDIRECTS)throw new Error('Atlas redirect limit exceeded')
    previous=current
    current=new URL(location,current).href
    continue
   }
   const metadata={
    status:response.status,
    contentType:typeof response.headers['content-type']==='string'?response.headers['content-type']:null,
    contentLength:typeof response.headers['content-length']==='string'?response.headers['content-length']:null
   }
   const policy=assessAtlasResearchResponse(metadata)
   if(!policy.allowed){response.stream.destroy();throw new Error('Atlas response rejected: '+policy.reasons.join('; '))}
   // Enforce the remaining overall deadline even during body streaming.
   const timer=setTimeout(()=>response.stream.destroy(new Error('Atlas research deadline exceeded')),Math.max(1,ATLAS_FETCH_TIMEOUT_MS-(Date.now()-started)))
   response.stream.once('close',()=>clearTimeout(timer))
   return {finalUrl:current,metadata,body:Readable.toWeb(response.stream) as ReadableStream<Uint8Array>}
  }
  throw new Error('Atlas redirect limit exceeded')
 }}
}
