import {prepareAtlasHtmlResearch} from '@/lib/atlas-html-research-pipeline'
import {NextResponse} from 'next/server'
import {buildAtlasNoteReviewProposal} from '@/lib/atlas-note-review-proposal'
import {atlasNoteProposalToCandidate} from '@/lib/atlas-note-queue-adapter'
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
 let candidate=input.candidate
 if(!candidate||typeof candidate!=='object'||Array.isArray(candidate))return NextResponse.json({error:'Candidate is required'},{status:400})
 if(input.sourceHtml!==undefined){
  if(input.sourceText!==undefined)return NextResponse.json({error:'Supply either sourceHtml or sourceText, not both'},{status:400})
  if(typeof input.sourceHtml!=='string'||typeof input.sourceUrl!=='string'||typeof input.capturedAt!=='string')return NextResponse.json({error:'Invalid HTML research evidence'},{status:400})
  const response=input.response
  if(!response||typeof response!=='object'||Array.isArray(response))return NextResponse.json({error:'HTML response metadata required'},{status:400})
  const metadata=response as Record<string,unknown>
  if(typeof metadata.status!=='number'||!(typeof metadata.contentType==='string'||metadata.contentType===null)||!(typeof metadata.contentLength==='string'||metadata.contentLength===null))return NextResponse.json({error:'Invalid HTML response metadata'},{status:400})
  try{
   const prepared=prepareAtlasHtmlResearch({candidate:candidate as Parameters<typeof prepareAtlasHtmlResearch>[0]['candidate'],sourceUrl:input.sourceUrl,capturedAt:input.capturedAt,response:{status:metadata.status,contentType:metadata.contentType as string|null,contentLength:metadata.contentLength as string|null},html:input.sourceHtml})
   candidate=prepared.queueCandidate
  }catch(error){return NextResponse.json({error:'Invalid HTML research proposal',details:error instanceof Error?error.message:'Unknown validation error'},{status:400})}
 }
 if(input.sourceText!==undefined){
  if(typeof input.sourceText!=='string'||typeof input.sourceUrl!=='string'||typeof input.capturedAt!=='string')return NextResponse.json({error:'Invalid source text evidence'},{status:400})
  try{
   const proposal=buildAtlasNoteReviewProposal(candidate,input.sourceText,input.sourceUrl,input.capturedAt)
   candidate=atlasNoteProposalToCandidate(proposal)
  }catch(error){return NextResponse.json({error:'Invalid note research proposal',details:error instanceof Error?error.message:'Unknown validation error'},{status:400})}
 }

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
   if(typeof brand!=='string'||!brand.trim())return NextResponse.json({error:'Catalog contains an unresolved brand; duplicate check cannot complete safely'},{status:503})
   existing.push({brand,name:perfume.name})
  }
  if(data.length<pageSize)break
  if(offset+pageSize===20000)return NextResponse.json({error:'Catalog duplicate scan exceeded safety limit'},{status:503})
 }
 const identity=perfumeResearchIdentity(normalized.brand,normalized.name)
 const duplicates=existing.filter(row=>perfumeResearchIdentity(row.brand,row.name)===identity)
 const id=crypto.randomUUID()
 const prepared=prepareAtlasResearchSubmission(normalized,duplicates,id,new Date().toISOString())
 if(!prepared.accepted)return NextResponse.json({error:'Invalid research candidate',details:prepared.errors},{status:400})
 const record=createAtlasResearchReviewRecord(prepared.submission)
 const {error:insertError}=await s.from('atlas_research_queue').insert(serializeAtlasResearchRow(record))
 if(insertError)return NextResponse.json({error:'Unable to queue research candidate'},{status:500})
 return NextResponse.json({id:record.id,status:record.status},{status:201})
}
