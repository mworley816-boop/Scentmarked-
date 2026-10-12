import {NextResponse} from 'next/server'
import {createClient} from '@/lib/supabase/server'
import {prepareAtlasResearchSubmission} from '@/lib/atlas-research-submission'
import {validatePerfumeResearchCandidate,perfumeResearchIdentity} from '@/lib/atlas-research-intake'
import {createAtlasResearchReviewRecord} from '@/lib/atlas-research-review'
import {serializeAtlasResearchRow} from '@/lib/atlas-research-storage'
import {assessAtlasSourceEvidence,type AtlasSourceEvidence} from '@/lib/atlas-source-evidence'

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
 const validated=validatePerfumeResearchCandidate(candidate)
 if(!validated.valid||!validated.normalized)return NextResponse.json({error:'Invalid research candidate',details:validated.errors},{status:400})
 const normalized=validated.normalized
 if(input.evidence!==undefined){
  const evidence=input.evidence
  if(!evidence||typeof evidence!=='object'||Array.isArray(evidence))return NextResponse.json({error:'Invalid source evidence'},{status:400})
  const fields=evidence as Record<string,unknown>
  if(!['manufacturerUrl','observedUrl','pageTitle','fetchedAt'].every(key=>typeof fields[key]==='string'))return NextResponse.json({error:'Incomplete source evidence'},{status:400})
  const assessment=assessAtlasSourceEvidence(normalized,fields as AtlasSourceEvidence)
  if(!assessment.metadataConsistent)return NextResponse.json({error:'Inconsistent source evidence',details:assessment.reasons},{status:400})
 }
 // Exhaustively scan queue and catalog in bounded pages; fail closed on errors.
 const existing:{brand:string;name:string}[]=[]
 const pageSize=500
 for(let offset=0;offset<20000;offset+=pageSize){
  const {data,error}=await s.from('atlas_research_queue').select('brand,perfume_name').order('id').range(offset,offset+pageSize-1)
  if(error||!data)return NextResponse.json({error:'Unable to check existing research'},{status:503})
  existing.push(...data.map(row=>({brand:row.brand,name:row.perfume_name})))
  if(data.length<pageSize)break
  if(offset+pageSize===20000)return NextResponse.json({error:'Research queue duplicate scan exceeded safety limit'},{status:503})
 }
 for(let offset=0;offset<20000;offset+=pageSize){
  const {data,error}=await s.from('perfumes').select('name,brands(name)').order('id').range(offset,offset+pageSize-1)
  if(error||!data)return NextResponse.json({error:'Unable to check perfume catalog'},{status:503})
  for(const perfume of data){
   const brandRelation=perfume.brands as unknown
   const brand=Array.isArray(brandRelation)?brandRelation[0]?.name:(brandRelation as {name?:string}|null)?.name
   if(typeof brand==='string')existing.push({brand,name:perfume.name})
  }
  if(data.length<pageSize)break
  if(offset+pageSize===20000)return NextResponse.json({error:'Catalog duplicate scan exceeded safety limit'},{status:503})
 }
 const identity=perfumeResearchIdentity(normalized.brand,normalized.name)
 const duplicates=existing.filter(row=>perfumeResearchIdentity(row.brand,row.name)===identity)
 const id=crypto.randomUUID()
 const prepared=prepareAtlasResearchSubmission(normalized,duplicates.map(row=>({brand:row.brand,name:row.perfume_name})),id,new Date().toISOString())
 if(!prepared.accepted)return NextResponse.json({error:'Invalid research candidate',details:prepared.errors},{status:400})
 const record=createAtlasResearchReviewRecord(prepared.submission)
 const {error:insertError}=await s.from('atlas_research_queue').insert(serializeAtlasResearchRow(record))
 if(insertError)return NextResponse.json({error:'Unable to queue research candidate'},{status:500})
 return NextResponse.json({id:record.id,status:record.status},{status:201})
}
