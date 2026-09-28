import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

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
 if(!brand||!name)redirect('/admin/perfumes/new?error='+encodeURIComponent('Brand and fragrance name are required.'))
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
 const result=await s.from('perfumes').insert({brand_id:brandId,name,slug:perfumeSlug,description:String(formData.get('description')||'').trim()||null,concentration:String(formData.get('concentration')||'').trim()||null,release_year:Number(formData.get('release_year'))||null,country:String(formData.get('country')||'').trim()||null,status:String(formData.get('status')||'draft')}).select('id').single()
 if(result.error)redirect('/admin/perfumes/new?error='+encodeURIComponent(result.error.message))
 const merchant_name=String(formData.get('merchant_name')||'').trim(),affiliate_url=String(formData.get('affiliate_url')||'').trim(),offer_label=String(formData.get('offer_label')||'').trim(),rawPrice=String(formData.get('offer_price')||'').trim(),offer_price=rawPrice===''?null:Number(rawPrice),currency=String(formData.get('currency')||'USD').trim().toUpperCase()
 if(merchant_name||affiliate_url){
  if(!merchant_name||!affiliate_url)redirect('/admin/perfumes/'+result.data.id+'/edit?error='+encodeURIComponent('The fragrance was created. Add both a merchant name and affiliate URL to create the retailer offer.'))
  try{const u=new URL(affiliate_url);if(!['http:','https:'].includes(u.protocol))throw new Error()}catch{redirect('/admin/perfumes/'+result.data.id+'/edit?error='+encodeURIComponent('The fragrance was created, but the affiliate URL was invalid. Add the retailer from this edit page.'))}
  if(offer_price!==null&&(!Number.isFinite(offer_price)||offer_price<0))redirect('/admin/perfumes/'+result.data.id+'/edit?error='+encodeURIComponent('The fragrance was created, but the retailer price was invalid. Add the retailer from this edit page.'))
  const offer=await s.from('perfume_affiliate_offers').insert({perfume_id:result.data.id,merchant_name,affiliate_url,price:offer_price,currency:currency||'USD',label:offer_label||null,is_active:true,priority:10})
  if(offer.error)redirect('/admin/perfumes/'+result.data.id+'/edit?error='+encodeURIComponent('The fragrance was created, but the retailer offer could not be saved: '+offer.error.message))
 }
 redirect('/admin/perfumes/'+result.data.id+'/edit?saved=created')
}

export default async function New({searchParams}:{searchParams:Promise<{error?:string}>}){
 await requireAdmin();const p=await searchParams
 return <main><section className="admin-editor"><p className="eyebrow">ADMIN · NEW FRAGRANCE</p><h1 className="page-title">Add a fragrance</h1><p className="lede">Create the core record, optionally add its first retailer, then continue directly into notes, accords and source verification.</p>{p.error&&<div className="notice error">{p.error}</div>}<form action={add} className="form"><label>Brand<input name="brand" required autoComplete="off"/></label><label>Fragrance name<input name="name" required autoComplete="off"/></label><label>Concentration<input name="concentration" placeholder="Eau de Parfum"/></label><label>Release year<input name="release_year" type="number" min="1800" max="2100"/></label><label>Country<input name="country" placeholder="United Arab Emirates"/></label><label>Description<textarea name="description" rows={5}/></label><label>Status<select name="status" defaultValue="draft"><option value="draft">Draft</option><option value="published">Published</option></select></label><section className="admin-panel"><h2>First retailer <span>optional</span></h2><p className="muted">Add an affiliate retailer now, or leave this section blank and add retailers later from the edit page.</p><label>Merchant<input name="merchant_name" placeholder="Retailer name"/></label><label>Affiliate URL<input name="affiliate_url" type="url" placeholder="https://…"/></label><label>Price <span>optional</span><input name="offer_price" type="number" min="0" step="0.01"/></label><label>Currency<input name="currency" maxLength={3} defaultValue="USD"/></label><label>Offer label <span>optional</span><input name="offer_label" placeholder="Best price, Free shipping…"/></label><p className="muted">The first retailer is created at priority 10, so it becomes the featured retailer unless you reorder offers later.</p></section><div className="rating-actions"><button className="button">Create &amp; Enrich</button><a className="button ghost" href="/admin">Cancel</a></div></form></section></main>
}
