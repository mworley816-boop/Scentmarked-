import {NextResponse} from 'next/server'
import {createClient} from '@/lib/supabase/server'

export async function POST(request:Request){
 const s=await createClient()
 const {data:{user},error:authError}=await s.auth.getUser()
 if(authError||!user)return NextResponse.json({error:'Unauthorized'},{status:401})
 const {data:profile,error:profileError}=await s.from('profiles').select('is_admin').eq('id',user.id).maybeSingle()
 if(profileError||profile?.is_admin!==true)return NextResponse.json({error:'Forbidden'},{status:403})
 let body:unknown
 try{body=await request.json()}catch{return NextResponse.json({error:'Invalid JSON'},{status:400})}
 if(!body||typeof body!=='object')return NextResponse.json({error:'Invalid review request'},{status:400})
 const input=body as Record<string,unknown>
 const id=typeof input.id==='string'?input.id.trim():''
 const action=input.action
 const note=typeof input.note==='string'?input.note.trim():''
 if(!id||id.length>160||(action!=='approve'&&action!=='reject')||note.length>4000||(action==='approve'&&!note)){
  return NextResponse.json({error:'Valid submission ID, action, and verification note are required'},{status:400})
 }
 const {data:current,error:readError}=await s.from('atlas_research_queue').select('id,status,decision').eq('id',id).maybeSingle()
 if(readError)return NextResponse.json({error:'Unable to load research submission'},{status:500})
 if(!current)return NextResponse.json({error:'Research submission not found'},{status:404})
 if(current.status==='approved'||current.status==='rejected')return NextResponse.json({error:'Already reviewed'},{status:409})
 if(current.decision==='duplicate'&&action==='approve')return NextResponse.json({error:'Duplicate submissions require reconciliation'},{status:409})
 const nextStatus=action==='approve'?'approved':'rejected'
 const {data:updated,error:updateError}=await s.from('atlas_research_queue').update({
  status:nextStatus,reviewed_at:new Date().toISOString(),reviewed_by:user.id,review_note:note||null
 }).eq('id',id).eq('status',current.status).select('id,status').maybeSingle()
 if(updateError)return NextResponse.json({error:'Unable to save research review'},{status:500})
 if(!updated)return NextResponse.json({error:'Submission changed during review'},{status:409})
 return NextResponse.json({id:updated.id,status:updated.status})
}
