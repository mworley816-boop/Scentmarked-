/** Response metadata gate for a future manufacturer-page research worker.
 * A real fetcher must also stream with a byte cap, deadline, and redirect limits.
 */
export const ATLAS_MAX_SOURCE_BYTES=1_000_000
export const ATLAS_MAX_REDIRECTS=3

export type AtlasResponseMetadata={status:number;contentType:string|null;contentLength:string|null}
export function assessAtlasResearchResponse(input:AtlasResponseMetadata):{allowed:boolean;reasons:string[]}{
 const reasons:string[]=[]
 if(!Number.isInteger(input.status)||input.status<200||input.status>=300)reasons.push('Source response must be successful')
 const mime=(input.contentType??'').split(';',1)[0].trim().toLowerCase()
 if(mime!=='text/html'&&mime!=='application/xhtml+xml')reasons.push('Source response must be HTML')
 if(input.contentLength!==null){
  const raw=input.contentLength.trim()
  if(!/^(0|[1-9][0-9]*)$/.test(raw))reasons.push('Invalid content length')
  else if(Number(raw)>ATLAS_MAX_SOURCE_BYTES)reasons.push('Source response exceeds byte limit')
 }
 return {allowed:reasons.length===0,reasons}
}
