import {assessAtlasAutomatedResearchSource} from './atlas-research-source-registry.ts'
import {assessAtlasResearchResponse,type AtlasResponseMetadata} from './atlas-research-response-policy.ts'
import {readAtlasBoundedHtml} from './atlas-research-stream.ts'

/** Only a separately audited implementation may supply this transport.
 * It MUST pin the network connection to vetted public IPs and revalidate every redirect.
 * Never substitute global fetch: preflight DNS alone is insufficient.
 */
export type AtlasVettedTransport={
 retrieve:(url:string)=>Promise<{
  finalUrl:string
  metadata:AtlasResponseMetadata
  body:ReadableStream<Uint8Array>|null
 }>
}

/** Produces untrusted HTML for extraction; no database writes or publication. */
export async function retrieveAtlasManufacturerHtml(input:{brand:string;url:string},transport:AtlasVettedTransport):Promise<string>{
 const source=assessAtlasAutomatedResearchSource(input.brand,input.url)
 if(!source.allowed)throw new Error('Manufacturer domain not approved for automated retrieval')
 const result=await transport.retrieve(input.url)
 const finalSource=assessAtlasAutomatedResearchSource(input.brand,result.finalUrl)
 if(!finalSource.allowed||new URL(result.finalUrl).origin!==new URL(input.url).origin)throw new Error('Research response changed to an unapproved origin')
 const response=assessAtlasResearchResponse(result.metadata)
 if(!response.allowed)throw new Error('Manufacturer response rejected: '+response.reasons.join('; '))
 return readAtlasBoundedHtml(result.body)
}
