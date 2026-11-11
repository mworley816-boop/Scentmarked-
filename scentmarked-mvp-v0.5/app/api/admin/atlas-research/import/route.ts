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
   const safeMessages:Record<string,string>={
    'Atlas research is not approved for import':'This research is not currently approved for import. Review its approval status and verification note.',
    'Fragrance already exists in catalog':'A fragrance with this brand and name already exists. Review the existing catalog entry before importing.',
    'Invalid manufacturer source URL':'The manufacturer source must be a valid HTTPS URL. Correct the research source before importing.',
    'Invalid Atlas research notes':'Atlas research must include between 1 and 100 valid fragrance notes.',
    'Unsupported Atlas note label':'Research notes must use Top, Heart, or Base labels.',
    'Invalid Atlas note name':'One or more fragrance note names are invalid.'
   }
   const message=safeMessages[error.message]||'Import could not be completed. Verify approval, source evidence, and duplicate status.'
   return NextResponse.json({error:message},{status:409})
  }
  if(typeof data!=='string')return NextResponse.json({error:'Unexpected import response'},{status:500})
  const {data:record,error:recordError}=await service.from('perfumes').select('id,status,name').eq('id',data).maybeSingle()
  if(!recordError&&record?.status==='archived'){
   return NextResponse.json({error:'This research was already imported, but the catalog entry is archived. Review the archived entry; do not import it again.',perfumeId:data,recordStatus:'archived'},{status:409})
  }
  if(recordError||!record||record.status!=='draft'){
   console.error('Atlas imported draft verification failed',{code:recordError?.code})
   return NextResponse.json({error:'Import response could not be verified. Check the catalog before retrying.',perfumeId:data},{status:500})
  }
  const [{count:noteCount,error:noteError},{count:sourceCount,error:sourceError}]=await Promise.all([
   service.from('perfume_notes').select('perfume_id',{count:'exact',head:true}).eq('perfume_id',data),
   service.from('perfume_sources').select('perfume_id',{count:'exact',head:true}).eq('perfume_id',data)
  ])
  if(noteError||sourceError||!noteCount||!sourceCount){
   console.error('Atlas import provenance verification failed',{noteCode:noteError?.code,sourceCode:sourceError?.code})
   return NextResponse.json({error:'Draft was imported, but its notes or source could not be verified. Inspect the catalog before retrying.',perfumeId:data},{status:500})
  }
  return NextResponse.json({perfumeId:data,status:'draft',name:record.name,noteCount,sourceCount})
 }catch{
  return NextResponse.json({error:'Catalog import service unavailable'},{status:503})
 }
}
