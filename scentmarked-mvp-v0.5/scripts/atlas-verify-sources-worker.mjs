// Non-paid Atlas employee: verify stored source URLs and save private review drafts.
// Requires an approved production migration and dedicated opt-in secrets.
const url=process.env.ATLAS_SUPABASE_URL
const key=process.env.ATLAS_SUPABASE_SERVICE_ROLE_KEY
const hosts=(process.env.ATLAS_VERIFICATION_ALLOWED_HOSTS??'').split(',').map(x=>x.trim().toLowerCase()).filter(Boolean)
if(!url||!key||!hosts.length){
 console.error('Atlas source verification cannot run: credentials or source allowlist not configured')
 process.exit(1)
}
const base=new URL(url)
if(base.protocol!=='https:'||!/^[a-z0-9-]+\.supabase\.co$/.test(base.hostname)||base.pathname!=='/'||base.search||base.hash)throw Error('Invalid Supabase URL')
if(hosts.some(h=>!/^[a-z0-9.-]+$/.test(h)||h.startsWith('.')||h.endsWith('.')))throw Error('Invalid source allowlist')
const rpc=async(name,body)=>{
 const controller=new AbortController()
 const timer=setTimeout(()=>controller.abort(),15000)
 try{
  const r=await fetch(new URL('/rest/v1/rpc/'+name,base),{
   method:'POST',signal:controller.signal,
   headers:{apikey:key,authorization:'Bearer '+key,'content-type':'application/json'},
   body:JSON.stringify(body)
  })
  if(!r.ok)throw Error('RPC '+name+' returned '+r.status)
  return r.json()
 }finally{clearTimeout(timer)}
}
const task=(await rpc('atlas_claim_source_verification_task',{p_lease_seconds:300}))[0]
if(!task){console.log('Atlas source verification: no queued task');process.exit(0)}
let success=false,error=null
try{
 const response=await fetch(new URL('/rest/v1/perfume_sources?perfume_id=eq.'+encodeURIComponent(task.perfume_id)+'&select=source_url&limit=8',base),{
  headers:{apikey:key,authorization:'Bearer '+key}
 })
 if(!response.ok)throw Error('Source lookup HTTP '+response.status)
 const sources=await response.json()
 const confirmed=[]
 for(const source of sources){
  let target
  try{target=new URL(source.source_url)}catch{continue}
  if(target.protocol!=='https:'||target.port||target.username||target.password||!hosts.includes(target.hostname.toLowerCase()))continue
  const controller=new AbortController()
  const timer=setTimeout(()=>controller.abort(),8000)
  try{
   const r=await fetch(target,{method:'GET',redirect:'manual',signal:controller.signal,headers:{accept:'text/html,text/plain'}})
   if(!r.ok||r.status>=300||!/^text\/(html|plain)(;|$)/i.test(r.headers.get('content-type')??''))continue
   const body=await r.text()
   if(body.length<30||body.length>200000)continue
   confirmed.push({url:target.toString(),claim:'Source URL reachable with readable text; content and fragrance claims require human review'})
  }catch{}finally{clearTimeout(timer)}
 }
 if(!confirmed.length)throw Error('No allowlisted readable source URLs; needs manual research')
 const draft=await rpc('atlas_save_employee_evidence_draft',{
  p_task_id:task.task_id,p_lease_token:task.lease_token,
  p_proposed_text:'Source reachability checked. This does not verify fragrance notes, product identity or claims.',
  p_sources:confirmed,p_image_reference:null,p_rights_status:null
 })
 if(typeof draft!=='string'||!draft)throw Error('Private draft was not confirmed')
 success=true
 console.log('Atlas source verification draft saved for one task')
}catch(e){error=e instanceof Error?e.message:'Source verification failed';console.error(error)}
const finished=await rpc('atlas_finish_employee_task',{
 p_task_id:task.task_id,p_lease_token:task.lease_token,p_success:success,p_error:error
})
if(finished!==true)throw Error('Task lease lost before completion')
if(!success)process.exitCode=1
