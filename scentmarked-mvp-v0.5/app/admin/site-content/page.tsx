import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import SiteMediaUpload from '@/components/site-media-upload'

export const dynamic='force-dynamic'
export const metadata={title:'Site Content | ScentMarked Studio',robots:{index:false,follow:false}}

async function admin(){
 const s=await createClient()
 const {data:{user}}=await s.auth.getUser()
 if(!user)redirect('/login?next=/admin/site-content')
 const {data}=await s.from('profiles').select('is_admin').eq('id',user.id).maybeSingle()
 if(data?.is_admin!==true)redirect('/discover')
 return s
}

const clean=(value:FormDataEntryValue|null)=>String(value||'').trim()
const optional=(value:FormDataEntryValue|null)=>clean(value)||null

async function saveContent(formData:FormData){
 'use server'
 const s=await admin(),id=clean(formData.get('content_id')),content_key=clean(formData.get('content_key'))
 const content_type=clean(formData.get('content_type'))||'section'
 if(!content_key)redirect('/admin/site-content?error='+encodeURIComponent('Content key is required.'))
 const payload={
  content_key,content_type,title:optional(formData.get('title')),subtitle:optional(formData.get('subtitle')),
  body:optional(formData.get('body')),image_url:optional(formData.get('image_url')),
  mobile_image_url:optional(formData.get('mobile_image_url')),alt_text:optional(formData.get('alt_text')),
  cta_label:optional(formData.get('cta_label')),cta_url:optional(formData.get('cta_url')),
  placement:optional(formData.get('placement')),sort_order:Number(formData.get('sort_order')||100),
  starts_at:optional(formData.get('starts_at')),ends_at:optional(formData.get('ends_at')),
  is_active:formData.get('is_active')==='on',updated_at:new Date().toISOString()
 }
 const result=id
  ?await s.from('site_content').update(payload).eq('id',id)
  :await s.from('site_content').insert(payload)
 if(result.error)redirect('/admin/site-content?error='+encodeURIComponent(result.error.message))
 redirect('/admin/site-content?saved=1')
}

async function removeContent(formData:FormData){
 'use server'
 const s=await admin(),id=clean(formData.get('content_id'))
 if(id){const {error}=await s.from('site_content').delete().eq('id',id);if(error)redirect('/admin/site-content?error='+encodeURIComponent(error.message))}
 redirect('/admin/site-content?deleted=1')
}

export default async function SiteContent({searchParams}:{searchParams:Promise<{edit?:string;preset?:string;view?:string;saved?:string;deleted?:string;error?:string}>}){
 const params=await searchParams,s=await admin()
 const {data,error}=await s.from('site_content').select('*').order('sort_order').order('content_key')
 const items=data||[],editing=params.edit?items.find((x:any)=>String(x.id)===params.edit):null,heroPreset=params.preset==='homepage-hero',bannerPreset=params.preset==='homepage-banner',discoverPreset=params.preset==='discover-banner',comparePreset=params.preset==='compare-banner',brandPreset=params.preset==='global-brand',announcementPreset=params.preset==='announcement-bar',footerPreset=params.preset==='footer-copy',socialPreset=params.preset==='social-image',perfumeFallbackPreset=params.preset==='perfume-fallback',faviconPreset=params.preset==='favicon',brandLogoFallbackPreset=params.preset==='brand-logo-fallback',brandBannerFallbackPreset=params.preset==='brand-banner-fallback',preset=heroPreset||bannerPreset||discoverPreset||comparePreset||brandPreset||announcementPreset||footerPreset||socialPreset||perfumeFallbackPreset||faviconPreset||brandLogoFallbackPreset||brandBannerFallbackPreset
 const imageOnlyPreset=!editing&&(socialPreset||perfumeFallbackPreset||faviconPreset||brandLogoFallbackPreset||brandBannerFallbackPreset),copyOnlyPreset=!editing&&footerPreset
 const view=params.view||'all',shown=view==='all'?items:items.filter((x:any)=>view==='banners'?x.content_type==='banner':x.placement===view)
 const contentNames:Record<string,string>={homepage_hero:'Homepage Hero',homepage_banner:'Homepage Banner',discover_banner:'Discover Banner',compare_banner:'Compare Banner',global_brand:'Global Brand',announcement_bar:'Announcement Bar',footer_copy:'Footer Copy',social_image:'Social Share Image',perfume_fallback:'Default Perfume Image',favicon:'Site Icon / Favicon',brand_logo_fallback:'Default Brand Logo',brand_banner_fallback:'Default Brand Banner'}
 const contentStatus=(item:any)=>{const now=Date.now();if(!item.is_active)return 'Inactive';if(item.starts_at&&new Date(item.starts_at).getTime()>now)return 'Scheduled';if(item.ends_at&&new Date(item.ends_at).getTime()<now)return 'Expired';return 'Live'}
 return <main><section className="admin-catalog">
  <p className="eyebrow">SCENTMARKED STUDIO</p>
  <div className="admin-heading"><div><h1 className="page-title">Site Content</h1><p>Manage hero sections, backgrounds, banners and promotional content.</p></div><div className="result-actions"><Link className="button ghost" href="/admin">Catalog Studio</Link></div></div>
  {(params.error||error)&&<p className="notice error">{params.error||error?.message}</p>}
  {params.saved&&<p className="notice">Site content saved.</p>}{params.deleted&&<p className="notice">Site content removed.</p>}
  <div className="admin-card"><div className="admin-heading"><div><h2>{editing?'Edit content':heroPreset?'Homepage Hero':bannerPreset?'Homepage Banner':discoverPreset?'Discover Banner':comparePreset?'Compare Banner':brandPreset?'Global Brand':announcementPreset?'Announcement Bar':footerPreset?'Footer Copy':socialPreset?'Social Share Image':perfumeFallbackPreset?'Default Perfume Image':faviconPreset?'Site Icon / Favicon':brandLogoFallbackPreset?'Default Brand Logo':brandBannerFallbackPreset?'Default Brand Banner':'Add site content'}</h2>{!editing&&<p>{heroPreset?'Controls the main hero shown at the top of the public homepage.':bannerPreset?'Creates a promotional banner for the public homepage.':discoverPreset?'Controls the visual banner at the top of Discover.':comparePreset?'Controls the visual banner at the top of Compare.':brandPreset?'Controls the site logo text, tagline and optional logo image.':announcementPreset?'Shows a scheduled announcement across the top of the site.':footerPreset?'Controls the brand description shown in the footer.':socialPreset?'Sets the default image used when ScentMarked is shared.':perfumeFallbackPreset?'Sets branded fallback artwork for fragrances that do not yet have a product image.':faviconPreset?'Sets the browser tab and bookmark icon for ScentMarked. Use a square image for best results.':brandLogoFallbackPreset?'Sets the fallback logo shown for brands that do not have their own logo yet.':brandBannerFallbackPreset?'Sets the fallback banner shown on brand pages that do not have their own banner yet.':'Choose a preset or create a custom site content block.'}</p>}</div>{!editing&&!preset&&<div className="result-actions"><Link className="button ghost" href="/admin/site-content?preset=homepage-hero">Homepage Hero</Link><Link className="button ghost" href="/admin/site-content?preset=homepage-banner">Homepage Banner</Link><Link className="button ghost" href="/admin/site-content?preset=discover-banner">Discover Banner</Link><Link className="button ghost" href="/admin/site-content?preset=compare-banner">Compare Banner</Link><Link className="button ghost" href="/admin/site-content?preset=global-brand">Global Brand</Link><Link className="button ghost" href="/admin/site-content?preset=announcement-bar">Announcement Bar</Link><Link className="button ghost" href="/admin/site-content?preset=footer-copy">Footer Copy</Link><Link className="button ghost" href="/admin/site-content?preset=social-image">Social Image</Link><Link className="button ghost" href="/admin/site-content?preset=perfume-fallback">Default Perfume Image</Link><Link className="button ghost" href="/admin/site-content?preset=favicon">Site Icon</Link><Link className="button ghost" href="/admin/site-content?preset=brand-logo-fallback">Default Brand Logo</Link><Link className="button ghost" href="/admin/site-content?preset=brand-banner-fallback">Default Brand Banner</Link></div>}</div>
   <form action={saveContent} className="admin-form">
    {editing&&<input type="hidden" name="content_id" value={editing.id}/>}
    <label>Content key<input name="content_key" required defaultValue={editing?.content_key||(heroPreset?'homepage_hero':bannerPreset?'homepage_banner':discoverPreset?'discover_banner':comparePreset?'compare_banner':brandPreset?'global_brand':announcementPreset?'announcement_bar':footerPreset?'footer_copy':socialPreset?'social_image':perfumeFallbackPreset?'perfume_fallback':faviconPreset?'favicon':brandLogoFallbackPreset?'brand_logo_fallback':brandBannerFallbackPreset?'brand_banner_fallback':'')} placeholder="homepage_hero"/></label>
    <label>Type<select name="content_type" defaultValue={editing?.content_type||(announcementPreset?'banner':(brandPreset||footerPreset||socialPreset||perfumeFallbackPreset||faviconPreset||brandLogoFallbackPreset||brandBannerFallbackPreset)?'global':(bannerPreset||discoverPreset||comparePreset)?'banner':'hero')}><option value="hero">Hero</option><option value="banner">Banner</option><option value="background">Background</option><option value="section">Section</option><option value="global">Global</option></select></label>
    <label>Placement<input name="placement" defaultValue={editing?.placement||(heroPreset||bannerPreset?'homepage':discoverPreset?'discover':comparePreset?'compare':(brandPreset||announcementPreset||footerPreset||socialPreset||perfumeFallbackPreset||faviconPreset||brandLogoFallbackPreset||brandBannerFallbackPreset)?'global':'')} placeholder="homepage, discover, compare"/></label>
    {!imageOnlyPreset&&<><label>Title<input name="title" defaultValue={editing?.title||''}/></label><label>Subtitle<input name="subtitle" defaultValue={editing?.subtitle||''}/></label><label>Body<textarea name="body" defaultValue={editing?.body||''}/></label></>}
    {!copyOnlyPreset&&<><SiteMediaUpload name="image_url" label={faviconPreset?'Square site icon':brandLogoFallbackPreset?'Default brand logo':brandBannerFallbackPreset?'Default brand banner':perfumeFallbackPreset?'Default perfume image':socialPreset?'Social share image':'Desktop image'} initialUrl={editing?.image_url||''}/>{!imageOnlyPreset&&<SiteMediaUpload name="mobile_image_url" label="Mobile image" initialUrl={editing?.mobile_image_url||''}/>}<label>Image alt text<input name="alt_text" defaultValue={editing?.alt_text||''}/></label></>}
    {!imageOnlyPreset&&!copyOnlyPreset&&<><label>Button text<input name="cta_label" defaultValue={editing?.cta_label||''}/></label><label>Button URL<input name="cta_url" defaultValue={editing?.cta_url||''}/></label></>}
    <label>Display order<input type="number" name="sort_order" defaultValue={editing?.sort_order??(heroPreset?10:bannerPreset?20:(discoverPreset||comparePreset)?10:100)}/></label>
    <label>Start date/time<input type="datetime-local" name="starts_at" defaultValue={editing?.starts_at?String(editing.starts_at).slice(0,16):""}/></label>
    <label>End date/time<input type="datetime-local" name="ends_at" defaultValue={editing?.ends_at?String(editing.ends_at).slice(0,16):""}/></label>
    <p>Leave scheduling blank to keep this content available whenever it is active.</p>
    <label><input type="checkbox" name="is_active" defaultChecked={editing?.is_active??true}/> Active</label>
    <div className="result-actions"><button className="button" type="submit">{editing?'Save Changes':'Add Content'}</button>{(editing||preset)&&<Link className="button ghost" href="/admin/site-content">Cancel</Link>}</div>
   </form>
  </div>
  <div className="admin-card"><div className="admin-heading"><div><h2>Content library</h2><p>Filter content by where it appears on ScentMarked.</p></div><div className="result-actions">{[["all","All"],["homepage","Homepage"],["discover","Discover"],["compare","Compare"],["global","Global"],["banners","Banners"]].map(([key,label])=><Link key={key} className={view===key?"button":"button ghost"} href={key==="all"?"/admin/site-content":"/admin/site-content?view="+key}>{label}</Link>)}</div></div>
   {!shown.length?<p>No content in this section yet.</p>:
    <div className="admin-list">{shown.map((item:any)=><article key={item.id} className="admin-row">
     <div style={{display:"flex",gap:14,alignItems:"center"}}>{item.image_url&&<img src={item.image_url} alt="" style={{width:90,height:64,objectFit:"cover",borderRadius:10}}/>}<div><b>{item.title||contentNames[item.content_key]||item.content_key}</b><p>{item.content_key} · {item.content_type}{item.placement?' · '+item.placement:''} · {contentStatus(item)}</p>{item.starts_at&&<small>Starts {new Date(item.starts_at).toLocaleString()}</small>}{item.ends_at&&<small style={{display:"block"}}>Ends {new Date(item.ends_at).toLocaleString()}</small>}</div></div>
     <div className="result-actions"><Link className="button ghost" href={'/admin/site-content?edit='+item.id}>Edit</Link><form action={removeContent}><input type="hidden" name="content_id" value={item.id}/><button className="button ghost" type="submit">Delete</button></form></div>
    </article>)}</div>}
  </div>
 </section></main>
}
