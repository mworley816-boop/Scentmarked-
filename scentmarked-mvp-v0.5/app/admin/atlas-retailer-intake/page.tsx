import Link from 'next/link'
import {redirect} from 'next/navigation'
import {revalidatePath} from 'next/cache'
import {createClient} from '@/lib/supabase/server'
import {validateAtlasRetailerCandidate,atlasCandidateToInactiveOffer} from '@/lib/atlas-retailer-candidates'

export const metadata={title:'Atlas Retailer Intake | Scentmarked',robots:{index:false,follow:false}}

async function adminClient(){
 const db=await createClient()
 const {data:{user}}=await db.auth.getUser()
 if(!user)redirect('/login?next=/admin/atlas-retailer-intake')
 const {data:profile}=await db.from('profiles').select('is_admin').eq('id',user.id).maybeSingle()
 if(profile?.is_admin!==true)redirect('/discover')
 return db
}

async function submitCandidate(form:FormData){
 'use server'
 const db=await adminClient()
 let payload:unknown
 try{payload=JSON.parse(String(form.get('candidate')||''))}catch{redirect('/admin/atlas-retailer-intake?error=json')}
 const result=validateAtlasRetailerCandidate(payload)
 if(!result.ok)redirect('/admin/atlas-retailer-intake?error=validation')
 const candidate=result.candidate
 const {data:perfume,error:lookupError}=await db.from('perfumes').select('id,name,brands(name)').eq('id',candidate.perfume_id).eq('status','published').maybeSingle()
 if(lookupError||!perfume)redirect('/admin/atlas-retailer-intake?error=match')
 const brand=(perfume.brands as {name?:string}|null)?.name||''
 if(brand.trim().toLowerCase()!==candidate.brand.toLowerCase()||perfume.name.trim().toLowerCase()!==candidate.perfume_name.toLowerCase())redirect('/admin/atlas-retailer-intake?error=match')
 const {data:existing,error:duplicateError}=await db.from('perfume_affiliate_offers').select('id,affiliate_url').eq('perfume_id',candidate.perfume_id).limit(200)
 if(duplicateError)redirect('/admin/atlas-retailer-intake?error=save')
 if(existing?.some(row=>row.affiliate_url===candidate.product_url))redirect('/admin/atlas-retailer-intake?error=duplicate')
 const {error}=await db.from('perfume_affiliate_offers').insert(atlasCandidateToInactiveOffer(candidate))
 if(error)redirect('/admin/atlas-retailer-intake?error=save')
 revalidatePath('/admin/retailer-offers')
 redirect('/admin/atlas-retailer-intake?saved=1')
}

export default async function AtlasRetailerIntake({searchParams}:{searchParams:Promise<{error?:string;saved?:string}>}){
 await adminClient()
 const params=await searchParams
 return <main className="container" style={{paddingBlock:'2rem'}}>
  <Link href="/admin/retailer-offers">← Retailer Offer Approval</Link>
  <h1>Atlas retailer candidate intake</h1>
  <p>This legacy manual JSON importer saves an inactive offer but does not preserve its research evidence in the private Atlas audit. For an auditable draft, use the authenticated Atlas retailer intake workflow. All offers remain inactive until you approve them.</p>
  {params.saved&&<p role="status">Candidate saved as an inactive retailer offer. Review it in Retailer Offer Approval.</p>}
  {params.error&&<p role="alert">{({json:'Invalid JSON.',validation:'Missing or unsafe candidate fields.',match:'Perfume ID, brand, or name does not match a published catalog record.',duplicate:'That product URL is already recorded for this perfume.',save:'Could not save candidate.'} as Record<string,string>)[params.error]||'Could not import candidate.'}</p>}
  <p><a href="https://github.com/mworley816-boop/Scentmarked-/actions/workflows/atlas-retailer-intake-e2e.yml" target="_blank" rel="noopener noreferrer">Open authenticated Atlas retailer draft intake ↗</a></p>
  <h2>Legacy manual import (no private audit record)</h2>
  <form action={submitCandidate}>
   <label htmlFor="candidate">Atlas candidate JSON</label>
   <textarea id="candidate" name="candidate" required rows={15} maxLength={12000} style={{width:'100%'}} placeholder={'{"perfume_id":"...","merchant_name":"...","product_url":"https://...","source_url":"https://...","brand":"...","perfume_name":"...","evidence_note":"..."}'}/>
   <button type="submit" className="button">Validate and save inactive draft</button>
  </form>
  <p className="muted">Before approving, independently verify the retailer listing, authenticity, stock, and any affiliate partnership. This manual form does not write private audit evidence. Use the authenticated intake workflow for auditable drafts.</p>
 </main>
}
