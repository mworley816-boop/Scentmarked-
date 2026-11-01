import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import {prepareAtlasApprovedCatalogDraft} from '@/lib/atlas-approved-catalog-draft'
import {parseAtlasImportNotes} from '@/lib/atlas-catalog-import-notes'
import {atlasImportKey} from '@/lib/atlas-import-idempotency'
import {createServiceClient} from '@/lib/supabase/service'

export const metadata={title:'Add Fragrance',robots:{index:false,follow:false}}

async function requireAdmin(){
 const s=await createClient()
 const {data:{user}}=await s.auth.getUser()
 if(!user)redirect('/login?next=/admin/perfumes/new')
 const {data}=await s.from('profiles').select('is_admin').eq('id',user.id).maybeSingle()
 if(data?.is_admin!==true)redirect('/discover')
 return s
}
const slug=(x:string)=>x.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'')

async function add(formData:FormData){
 'use server'
 const s=await requireAdmin(),brand=String(formData.get('brand')||'').trim(),name=String(formData.get('name')||'').trim()
 const rawAtlasResearchId=String(formData.get('atlasResearchId')||'').trim()
 let atlasResearchId=''
 if(rawAtlasResearchId){try{atlasResearchId=atlasImportKey(rawAtlasResearchId)}catch{redirect('/admin/perfumes/new?error='+encodeURIComponent('Invalid Atlas research identifier'))}}
 let atlasApprovedNotes:string[]|null=null
 if(atlasResearchId){
  const {data,error}=await s.from('atlas_research_queue').select('id,brand,perfume_name,manufacturer_url,source_notes,status,reviewed_by,reviewed_at,review_note').eq('id',atlasResearchId).maybeSingle()
  if(error||!data)redirect('/admin/perfumes/new?error='+encodeURIComponent('Approved Atlas research unavailable'))
  let verified=false
  try{const draft=prepareAtlasApprovedCatalogDraft(data);verified=draft.brand===brand&&draft.name===name;atlasApprovedNotes=verified?draft.sourceNotes:null}catch{verified=false}
  if(!verified)redirect('/admin/perfumes/new?error='+encodeURIComponent('Atlas research approval or identity could not be verified'))
 }
 if(atlasApprovedNotes){
  let valid=false
  try{parseAtlasImportNotes(atlasApprovedNotes);valid=true}catch{valid=false}
  if(!valid)redirect('/admin/perfumes/new?error='+encodeURIComponent('Atlas research contains invalid note labels. Review the research before creating a draft.'))
 }
 if(!brand||!name)redirect('/admin/perfumes/new?error='+encodeURIComponent('Brand and fragrance name are required.'))
 const merchant_name=String(formData.get('merchant_name')||'').trim(),affiliate_url=String(formData.get('affiliate_url')||'').trim(),offer_label=String(formData.get('offer_label')||'').trim(),rawPrice=String(formData.get('offer_price')||'').trim(),offer_price=rawPrice===''?null:Number(rawPrice),currency=String(formData.get('currency')||'USD').trim().toUpperCase()
 if(merchant_name||affiliate_url){
  if(!merchant_name||!affiliate_url)redirect('/admin/perfumes/new?error='+encodeURIComponent('Enter both a merchant name and affiliate URL, or leave both blank.'))
  try{const u=new URL(affiliate_url);if(!['http:','https:'].includes(u.protocol))throw new Error()}catch{redirect('/admin/perfumes/new?error='+encodeURIComponent('Enter a valid retailer URL before creating the fragrance.'))}
  if(offer_price!==null&&(!Number.isFinite(offer_price)||offer_price<0))redirect('/admin/perfumes/new?error='+encodeURIComponent('Enter a valid retailer price before creating the fragrance.'))
 }
 if(atlasResearchId){
  if(merchant_name||affiliate_url){
   redirect('/admin/perfumes/new?error='+encodeURIComponent('Create the Atlas draft first, then add retailer offers from its edit page.'))
  }
  // requireAdmin() already checked the authenticated user's current admin role.
  // Never expose the service credential to the browser or invoke this RPC without that check.
  let service:ReturnType<typeof createServiceClient>
  try{service=createServiceClient()}catch{
   redirect('/admin/perfumes/new?error='+encodeURIComponent('Atlas atomic import is not configured on this server. No draft was created.'))
  }
  const yearRaw=String(formData.get('release_year')||'').trim()
  const year=yearRaw?Number(yearRaw):null
  if(year!==null&&(!Number.isInteger(year)||year<1800||year>2100)){
   redirect('/admin/perfumes/new?error='+encodeURIComponent('Invalid release year.'))
  }
  const {data:importedId,error:importError}=await service.rpc('import_approved_atlas_catalog_draft',{
   p_research_id:atlasResearchId,
   p_description:String(formData.get('description')||'').trim()||null,
   p_concentration:String(formData.get('concentration')||'').trim()||null,
   p_release_year:year,
   p_country:String(formData.get('country')||'').trim()||null
  })
  if(importError||!importedId){
   redirect('/admin/perfumes/new?error='+encodeURIComponent('Atomic Atlas import failed; no partial draft was created. '+(importError?.message||'Unknown error')))
  }
  // Retailer offers are separate optional additions, not part of the atomic import.
  // Add them later from the editor to avoid suggesting they were committed atomically.
  redirect('/admin/perfumes/'+importedId+'/edit?saved=created')
 }
 const brandSlug=slug(brand)
 if(!brandSlug||!slug(name))redirect('/admin/perfumes/new?error='+encodeURIComponent('Use a valid brand and fragrance name.'))
 let brandId:string
 const existingBrand=await s.from('brands').select('id').eq('slug',brandSlug).maybeSingle()
 if(existingBrand.error)redirect('/admin/perfumes/new?error='+encodeURIComponent(existingBrand.error.message))
 if(existingBrand.data?.id)brandId=existingBrand.data.id
 else{const made=await s.from('brands').insert({name:brand,slug:brandSlug}).select('id').single();if(made.error)redirect('/admin/perfumes/new?error='+encodeURIComponent(made.error.message));brandId=made.data.id}
 const duplicate=await s.from('perfumes').select('id').eq('brand_id',brandId).ilike('name',name).limit(1).maybeSingle()
 if(duplicate.data?.id)redirect('/admin/perfumes/'+duplicate.data.id+'/edit?error='+encodeURIComponent('This fragrance already exists in the catalog.'))
 const baseSlug=slug(brand+' '+name)
 let perfumeSlug=baseSlug,n=2
 while(true){const check=await s.from('perfumes').select('id').eq('slug',perfumeSlug).maybeSingle();if(!check.data)break;perfumeSlug=baseSlug+'-'+n++}
 const result=await s.from('perfumes').insert({brand_id:brandId,name,slug:perfumeSlug,description:String(formData.get('description')||'').trim()||null,concentration:String(formData.get('concentration')||'').trim()||null,release_year:Number(formData.get('release_year'))||null,country:String(formData.get('country')||'').trim()||null,status:atlasResearchId?'draft':String(formData.get('status')||'draft')}).select('id').single()
 if(result.error)redirect('/admin/perfumes/new?error='+encodeURIComponent(result.error.message))
 if(atlasResearchId){
  const {data:approved,error:approvedError}=await s.from('atlas_research_queue').select('id,brand,perfume_name,manufacturer_url,source_notes,status,reviewed_by,reviewed_at,review_note').eq('id',atlasResearchId).maybeSingle()
  if(approvedError||!approved)redirect('/admin/perfumes/'+result.data.id+'/edit?error='+encodeURIComponent('Draft created, but Atlas notes could not be loaded'))
  let notes:string[]|null=null
  try{notes=prepareAtlasApprovedCatalogDraft(approved).sourceNotes}catch{notes=null}
  if(!notes)redirect('/admin/perfumes/'+result.data.id+'/edit?error='+encodeURIComponent('Draft created, but Atlas note approval is no longer valid'))
  for(const {position,name:noteName} of parseAtlasImportNotes(notes)){
   const existing=await s.from('notes').select('id').ilike('name',noteName).limit(1).maybeSingle()
   if(existing.error)redirect('/admin/perfumes/'+result.data.id+'/edit?error='+encodeURIComponent('Draft created, but Atlas note lookup failed'))
   let noteId=existing.data?.id
   if(!noteId){
    const made=await s.from('notes').insert({name:noteName,slug:slug(noteName)}).select('id').single()
    if(made.error)redirect('/admin/perfumes/'+result.data.id+'/edit?error='+encodeURIComponent('Draft created, but Atlas note creation failed'))
    noteId=made.data.id
   }
   const {error:linkError}=await s.from('perfume_notes').upsert({perfume_id:result.data.id,note_id:noteId,position},{onConflict:'perfume_id,note_id,position'})
   if(linkError)redirect('/admin/perfumes/'+result.data.id+'/edit?error='+encodeURIComponent('Draft created, but some Atlas notes could not be linked'))
  }
 }
 if(atlasResearchId){
  const {data:approved,error:sourceLookupError}=await s.from('atlas_research_queue').select('id,brand,perfume_name,manufacturer_url,source_notes,status,reviewed_by,reviewed_at,review_note').eq('id',atlasResearchId).maybeSingle()
  if(sourceLookupError||!approved)redirect('/admin/perfumes/'+result.data.id+'/edit?error='+encodeURIComponent('Draft created, but Atlas source could not be retrieved'))
  let sourceUrl:string|null=null
  try{sourceUrl=prepareAtlasApprovedCatalogDraft(approved).sourceUrl}catch{sourceUrl=null}
  if(!sourceUrl)redirect('/admin/perfumes/'+result.data.id+'/edit?error='+encodeURIComponent('Draft created, but Atlas source approval was invalidated'))
  const {error:sourceError}=await s.from('perfume_sources').upsert({
   perfume_id:result.data.id,source_name:'Atlas approved manufacturer research',
   source_url:sourceUrl,source_type:'official',
   // Atlas approval records reviewed research, not independent catalog field verification.
   fields_verified:[],is_primary:false,
   checked_at:new Date().toISOString()
  },{onConflict:'perfume_id,source_url'})
  if(sourceError)redirect('/admin/perfumes/'+result.data.id+'/edit?error='+encodeURIComponent('Draft created with notes, but source provenance could not be saved: '+sourceError.message))
 }

 if(merchant_name||affiliate_url){
  const offer=await s.from('perfume_affiliate_offers').insert({perfume_id:result.data.id,merchant_name,affiliate_url,price:offer_price,currency:currency||'USD',label:offer_label||null,is_active:true,priority:10})
  if(offer.error)redirect('/admin/perfumes/'+result.data.id+'/edit?error='+encodeURIComponent('The fragrance was created, but the retailer offer could not be saved: '+offer.error.message))
 }
 redirect('/admin/perfumes/'+result.data.id+'/edit?saved=created')
}

export default async function New({searchParams}:{searchParams:Promise<{error?:string;atlasResearchId?:string}>}){
 const db=await requireAdmin();const p=await searchParams
 let atlasDraft:ReturnType<typeof prepareAtlasApprovedCatalogDraft>|null=null
 if(p.atlasResearchId&&p.atlasResearchId.length<=160){
  const {data,error}=await db.from('atlas_research_queue').select('id,brand,perfume_name,manufacturer_url,source_notes,status,reviewed_by,reviewed_at,review_note').eq('id',p.atlasResearchId).maybeSingle()
  if(!error&&data){try{atlasDraft=prepareAtlasApprovedCatalogDraft(data)}catch{}}
 }
 return <main><section className="admin-editor"><p className="eyebrow">ADMIN · NEW FRAGRANCE</p><h1 className="page-title">Add a fragrance</h1><p className="lede">Create the core record, optionally add its first retailer, then continue directly into notes, accords and source verification.</p>{p.atlasResearchId&&!atlasDraft&&<div className="notice error">Atlas research was not approved or could not be verified. Nothing was prefilled.</div>}{atlasDraft&&<div className="notice"><strong>Approved Atlas research loaded.</strong> Review the details before saving. This form creates an unpublished draft and imports labeled Top, Heart, and Base notes. Review the notes and source before publishing. <a href={atlasDraft.sourceUrl} target="_blank" rel="noopener noreferrer">Inspect source</a><p>Extracted notes: {atlasDraft.sourceNotes.join(', ')}</p></div>}{p.error&&<div className="notice error">{p.error}</div>}<form action={add} className="form">{atlasDraft&&<input type="hidden" name="atlasResearchId" value={atlasDraft.researchId}/>}<label>Brand<input name="brand" required autoComplete="off" defaultValue={atlasDraft?.brand??""}/></label><label>Fragrance name<input name="name" required autoComplete="off" defaultValue={atlasDraft?.name??""}/></label><label>Concentration<input name="concentration" placeholder="Eau de Parfum"/></label><label>Release year<input name="release_year" type="number" min="1800" max="2100"/></label><label>Country<input name="country" placeholder="United Arab Emirates"/></label><label>Description<textarea name="description" rows={5}/></label><label>Status<select name="status" defaultValue="draft"><option value="draft">Draft</option>{!atlasDraft&&<option value="published">Published</option>}</select></label><section className="admin-panel"><h2>First retailer <span>optional</span></h2><p className="muted">Add an affiliate retailer now, or leave this section blank and add retailers later from the edit page.</p><label>Merchant<input name="merchant_name" placeholder="Retailer name"/></label><label>Affiliate URL<input name="affiliate_url" type="url" placeholder="https://…"/></label><label>Price <span>optional</span><input name="offer_price" type="number" min="0" step="0.01"/></label><label>Currency<input name="currency" maxLength={3} defaultValue="USD"/></label><label>Offer label <span>optional</span><input name="offer_label" placeholder="Best price, Free shipping…"/></label><p className="muted">The first retailer is created at priority 10, so it becomes the featured retailer unless you reorder offers later.</p></section><div className="rating-actions"><button className="button">Create &amp; Enrich</button><a className="button ghost" href="/admin">Cancel</a></div></form></section></main>
}
