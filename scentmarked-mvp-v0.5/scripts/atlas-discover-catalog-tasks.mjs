// Automated, non-metered Atlas assignment discovery. Never claims work or calls AI.
const endpoint=process.env.ATLAS_SUPABASE_URL?.trim()
const key=process.env.ATLAS_SUPABASE_SERVICE_ROLE_KEY?.trim()
if(!endpoint||!key){
 console.error('Atlas discovery cannot run: configure ATLAS_SUPABASE_URL and ATLAS_SUPABASE_SERVICE_ROLE_KEY')
 process.exit(1)
}
let base
try{
 base=new URL(endpoint)
 if(base.protocol!=='https:'||base.username||base.password||base.search||base.hash)
  throw new Error('Invalid URL')
}catch{
 console.error('Atlas discovery requires a valid HTTPS Supabase URL')
 process.exit(1)
}
if(!/^[a-z0-9-]+\.supabase\.co$/.test(base.hostname)||base.pathname!=='/'){
 console.error('Atlas discovery requires a Supabase project root URL')
 process.exit(1)
}
const limit=Number(process.env.ATLAS_DISCOVERY_LIMIT??100)
if(!Number.isSafeInteger(limit)||limit<1||limit>500){
 console.error('Atlas discovery limit must be between 1 and 500')
 process.exit(1)
}
const controller=new AbortController()
const timeout=setTimeout(()=>controller.abort(),20000)
try{
 const response=await fetch(new URL('/rest/v1/rpc/atlas_enqueue_catalog_employee_tasks',base),{
  method:'POST',signal:controller.signal,
  headers:{apikey:key,authorization:'Bearer '+key,'content-type':'application/json',accept:'application/json'},
  body:JSON.stringify({p_limit:limit})
 })
 if(!response.ok){
  console.error('Atlas discovery RPC failed with HTTP '+response.status)
  process.exitCode=1
 }else{
  const count=await response.json()
  if(!Number.isSafeInteger(count)||count<0||count>limit)throw new Error('Unexpected discovery count')
  console.log('Atlas catalog tasks queued: '+count)
 }
}catch(error){
 console.error('Atlas discovery failed: '+(error instanceof Error?error.message:'unknown error'))
 process.exitCode=1
}finally{clearTimeout(timeout)}
