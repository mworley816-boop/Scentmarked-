import {ATLAS_MAX_SOURCE_BYTES} from './atlas-research-response-policy.ts'

/** Consume an already-authorized response stream with a strict byte cap.
 * Network security, redirect handling, DNS pinning, and timeouts are caller responsibilities.
 */
export async function readAtlasBoundedHtml(
 stream:ReadableStream<Uint8Array>|null,
 maxBytes:number=ATLAS_MAX_SOURCE_BYTES
):Promise<string>{
 if(!stream)throw new Error('Missing research response body')
 if(!Number.isSafeInteger(maxBytes)||maxBytes<1||maxBytes>ATLAS_MAX_SOURCE_BYTES)throw new Error('Invalid research byte cap')
 const reader=stream.getReader()
 const chunks:Uint8Array[]=[]
 let total=0
 try{
  while(true){
   const {done,value}=await reader.read()
   if(done)break
   if(!(value instanceof Uint8Array))throw new Error('Invalid research response chunk')
   total+=value.byteLength
   if(total>maxBytes)throw new Error('Research response exceeds byte limit')
   chunks.push(value)
  }
 }catch(error){
  await reader.cancel().catch(()=>{})
  throw error
 }finally{reader.releaseLock()}
 const bytes=new Uint8Array(total)
 let offset=0
 for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.byteLength}
 return new TextDecoder('utf-8',{fatal:true}).decode(bytes)
}
