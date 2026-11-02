import {NextResponse} from 'next/server'
import {createClient} from '@/lib/supabase/server'
import {createServiceClient} from '@/lib/supabase/service'

export async function POST(request:Request){
 const s=await createClient()
 const {data:{user},error:authError}=await s.auth.getUser()
 if(authError||!user)return NextResponse.json({error:'Unauthorized'},{status:401})
 const {data:profile,error:profileError}=await s.from('profiles').select('is_admin').eq('id',user.id).maybeSingle()
 if(profileError||profile?.is_admin!==true)return NextResponse.json({error:'Forbidden'},{status:403})
 let body:unknown
 try{body=await request.json()}catch{return NextResponse.json({error:'Invalid JSON'},{status:400})}
 if(!body||typeof body!=='object')return NextResponse.json({error:'Invalid request'},{status:400})
 const input=body as Record<string,unknown>
 const id=typeof input.id==='string'?input.id.trim():''
 if(!id||id.length>160)return NextResponse.json({error:'Invalid research ID'},{status:400})
 try{
  const service=createServiceClient()
  const {data,error}=await service.rpc('import_approved_atlas_catalog_draft',{p_research_id:id})
  if(error){
   console.error('Atlas catalog draft import failed',{code:error.code})
   return NextResponse.json({error:'Import could not be completed. Verify approval, source evidence, and duplicate status.'},{status:409})
  }
  if(typeof data!=='string')return NextResponse.json({error:'Unexpected import response'},{status:500})
  return NextResponse.json({perfumeId:data,status:'draft'})
 }catch{
  return NextResponse.json({error:'Catalog import service unavailable'},{status:503})
 }
}
