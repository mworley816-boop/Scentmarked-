import {NextResponse} from 'next/server'
import {authorizeHyperdriveDiagnostic} from '@/lib/hyperdrive-diagnostic-auth'
import {recordPrivateRetailerEvidence} from '@/lib/atlas-retailer-evidence-audit'
import {createServiceClient} from '@/lib/supabase/service'
import {validateAtlasRetailerCandidate,atlasCandidateToInactiveOffer} from '@/lib/atlas-retailer-candidates'

export const runtime='nodejs'
export const dynamic='force-dynamic'

export async function POST(request:Request){
 if(!process.env.ATLAS_RETAILER_INTAKE_SECRET||process.env.ATLAS_RETAILER_INTAKE_SECRET.length<32)
  return NextResponse.json({error:'Atlas retailer intake is not configured'},{status:503})
 if(!await authorizeHyperdriveDiagnostic(request.headers.get('authorization'),process.env.ATLAS_RETAILER_INTAKE_SECRET))return NextResponse.json({error:'Unauthorized'},{status:401})
 const length=Number(request.headers.get('content-length')||0)
 if(length>12000)return NextResponse.json({error:'Payload too large'},{status:413})
 let input:unknown
 try{
  const raw=await request.text()
  if(raw.length>12000)return NextResponse.json({error:'Payload too large'},{status:413})
  input=JSON.parse(raw)
 }catch{return NextResponse.json({error:'Invalid JSON'},{status:400})}
 const result=validateAtlasRetailerCandidate(input)
 if(!result.ok)return NextResponse.json({error:result.reason},{status:422})
 const candidate=result.candidate
 try{
  const db=createServiceClient()
  const {data:perfume,error:lookupError}=await db.from('perfumes').select('id,name,brands(name)').eq('id',candidate.perfume_id).eq('status','published').maybeSingle()
  if(lookupError)return NextResponse.json({error:'Catalog lookup failed'},{status:503})
  if(!perfume)return NextResponse.json({error:'Perfume not found'},{status:422})
  const brand=(perfume.brands as {name?:string}|null)?.name||''
  if(brand.trim().toLowerCase()!==candidate.brand.toLowerCase()||perfume.name.trim().toLowerCase()!==candidate.perfume_name.toLowerCase())
   return NextResponse.json({error:'Catalog identity mismatch'},{status:422})
  const {data:matches,error:matchError}=await db.from('perfume_affiliate_offers').select('id').eq('perfume_id',candidate.perfume_id).eq('affiliate_url',candidate.product_url).limit(1)
  if(matchError)return NextResponse.json({error:'Duplicate check failed'},{status:503})
  if(matches?.length)return NextResponse.json({error:'Duplicate candidate'},{status:409})
  if(!await recordPrivateRetailerEvidence(candidate))return NextResponse.json({error:'Private research audit unavailable; draft not created'},{status:503})
  const {error}=await db.from('perfume_affiliate_offers').insert(atlasCandidateToInactiveOffer(candidate))
  if(error)return NextResponse.json({error:'Unable to save inactive draft'},{status:503})
  return NextResponse.json({status:'draft_created',published:false},{status:201,headers:{'Cache-Control':'no-store'}})
 }catch{return NextResponse.json({error:'Intake unavailable'},{status:503})}
}
