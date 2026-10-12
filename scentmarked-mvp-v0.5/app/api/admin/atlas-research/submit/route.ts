import {NextResponse} from 'next/server'
import {createClient} from '@/lib/supabase/server'
import {prepareAtlasResearchSubmission} from '@/lib/atlas-research-submission'
import {createAtlasResearchReviewRecord} from '@/lib/atlas-research-review'
import {serializeAtlasResearchRow} from '@/lib/atlas-research-storage'

export async function POST(request:Request){
 const s=await createClient()
 const {data:{user},error:authError}=await s.auth.getUser()
 if(authError||!user)return NextResponse.json({error:'Unauthorized'},{status:401})
 const {data:profile,error:profileError}=await s.from('profiles').select('is_admin').eq('id',user.id).maybeSingle()
 if(profileError||profile?.is_admin!==true)return NextResponse.json({error:'Forbidden'},{status:403})
 let body:unknown
 try{body=await request.json()}catch{return NextResponse.json({error:'Invalid JSON'},{status:400})}
 if(!body||typeof body!=='object'||Array.isArray(body))return NextResponse.json({error:'Invalid research submission'},{status:400})
 const input=body as Record<string,unknown>
 const candidate=input.candidate
 if(!candidate||typeof candidate!=='object'||Array.isArray(candidate))return NextResponse.json({error:'Candidate is required'},{status:400})
 const data=candidate as Record<string,unknown>
 const brand=typeof data.brand==='string'?data.brand.trim():''
 const name=typeof data.name==='string'?data.name.trim():''
 const {data:existing,error:existingError}=await s.from('atlas_research_queue').select('brand,perfume_name').eq('brand',brand).eq('perfume_name',name).limit(1)
 if(existingError)return NextResponse.json({error:'Unable to check existing research'},{status:500})
 const id=crypto.randomUUID()
 const prepared=prepareAtlasResearchSubmission(candidate,(existing||[]).map(row=>({brand:row.brand,name:row.perfume_name})),id,new Date().toISOString())
 if(!prepared.accepted)return NextResponse.json({error:'Invalid research candidate',details:prepared.errors},{status:400})
 const record=createAtlasResearchReviewRecord(prepared.submission)
 const {error:insertError}=await s.from('atlas_research_queue').insert(serializeAtlasResearchRow(record))
 if(insertError)return NextResponse.json({error:'Unable to queue research candidate'},{status:500})
 return NextResponse.json({id:record.id,status:record.status},{status:201})
}
