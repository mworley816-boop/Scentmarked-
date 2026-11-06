import type {AtlasSourceRecord} from './atlas-source-context-loader.ts'

// Server-only, opt-in collector. Operators must configure an exact hostname
// allowlist; this never crawls links or follows redirects.
export function createAtlasEvidenceCollector(options:{
 allowedHosts:readonly string[];
 fetchImpl?:typeof fetch;
 maxBytes?:number
}){
 const allowed=new Set(options.allowedHosts.map(host=>host.toLowerCase()))
 if(!allowed.size||[...allowed].some(host=>!host||host.includes('/')||host.includes(':')||host.includes('*')))
  throw new Error('Exact trusted source hosts must be configured')
 const maxBytes=Math.min(Math.max(options.maxBytes??120000,1024),200000)
 return async(perfumeId:string,urls:readonly string[]):Promise<AtlasSourceRecord[]>=>{
  const records:AtlasSourceRecord[]=[]
  for(const candidate of urls.slice(0,8)){
   let url:URL
   try{url=new URL(candidate)}catch{continue}
   if(url.protocol!=='https:'||url.port||url.username||url.password||!allowed.has(url.hostname.toLowerCase()))continue
   try{
    const response=await (options.fetchImpl??fetch)(url.toString(),{
     method:'GET',redirect:'manual',signal:AbortSignal.timeout(8000),
     headers:{accept:'text/html, text/plain'}
    })
    if(!response.ok||response.status>=300||!response.body)continue
    const type=response.headers.get('content-type')??''
    if(!/^(text\/html|text\/plain)(;|$)/i.test(type))continue
    const declared=Number(response.headers.get('content-length'))
    if(Number.isFinite(declared)&&declared>maxBytes)continue
    const reader=response.body.getReader()
    const chunks:Uint8Array[]=[]
    let total=0
    try{
     while(true){
      const {done,value}=await reader.read()
      if(done)break
      total+=value.byteLength
      if(total>maxBytes)throw new Error('Source exceeds size limit')
      chunks.push(value)
     }
    }finally{await reader.cancel().catch(()=>{})}
    const bytes=new Uint8Array(total)
    let offset=0
    for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.byteLength}
    const raw=new TextDecoder('utf-8',{fatal:false}).decode(bytes)
    const excerpt=(type.toLowerCase().startsWith('text/html')
     ?raw.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,' ').replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi,' ').replace(/<[^>]+>/g,' ')
     :raw).replace(/\s+/g,' ').trim().slice(0,3000)
    if(excerpt.length<30)continue
    records.push({perfumeId,url:url.toString(),excerpt})
   }catch{/* Failed or oversized sources are omitted, never invented. */}
  }
  return records
 }
}
