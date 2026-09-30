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

export default async function SiteContent({searchParams}:{searchParams:Promise<{edit?:string;preset?:string;saved?:string;deleted?:string;error?:string}>}){
 const params=await searchParams,s=await admin()
 const {data,error}=await s.from('site_content').select('*').order('sort_order').order('content_key')
 const items=data||[],editing=params.edit?items.find((x:any)=>String(x.id)===params.edit):null,heroPreset=params.preset==='homepage-hero',bannerPreset=params.preset==='homepage-banner',preset=heroPreset||bannerPreset
 return <main><section className="admin-catalog">
  <p className="eyebrow">SCENTMARKED STUDIO</p>
  <div className="admin-heading"><div><h1 className="page-title">Site Content</h1><p>Manage hero sections, backgrounds, banners and promotional content.</p></div><div className="result-actions"><Link className="button ghost" href="/admin">Catalog Studio</Link></div></div>
  {(params.error||error)&&<p className="notice error">{params.error||error?.message}</p>}
  {params.saved&&<p className="notice">Site content saved.</p>}{params.deleted&&<p className="notice">Site content removed.</p>}
  <div className="admin-card"><div className="admin-heading"><div><h2>{editing?'Edit content':heroPreset?'Homepage Hero':bannerPreset?'Homepage Banner':'Add site content'}</h2>{!editing&&<p>{heroPreset?'Controls the main hero shown at the top of the public homepage.':bannerPreset?'Creates a promotional banner for the public homepage.':'Choose a preset or create a custom site content block.'}</p>}</div>{!editing&&!preset&&<div className="result-actions"><Link className="button ghost" href="/admin/site-content?preset=homepage-hero">Homepage Hero</Link><Link className="button ghost" href="/admin/site-content?preset=homepage-banner">Homepage Banner</Link></div>}</div>
   <form action={saveContent} className="admin-form">
    {editing&&<input type="hidden" name="content_id" value={editing.id}/>}
    <label>Content key<input name="content_key" required defaultValue={editing?.content_key||(heroPreset?'homepage_hero':bannerPreset?'homepage_banner':'')} placeholder="homepage_hero"/></label>
    <label>Type<select name="content_type" defaultValue={editing?.content_type||(bannerPreset?'banner':'hero')}><option value="hero">Hero</option><option value="banner">Banner</option><option value="background">Background</option><option value="section">Section</option><option value="global">Global</option></select></label>
    <label>Placement<input name="placement" defaultValue={editing?.placement||(preset?'homepage':'')} placeholder="homepage, discover, compare"/></label>
    <label>Title<input name="title" defaultValue={editing?.title||''}/></label>
    <label>Subtitle<input name="subtitle" defaultValue={editing?.subtitle||''}/></label>
    <label>Body<textarea name="body" defaultValue={editing?.body||''}/></label>
    <SiteMediaUpload name="image_url" label="Desktop image" initialUrl={editing?.image_url||''}/>
    <SiteMediaUpload name="mobile_image_url" label="Mobile image" initialUrl={editing?.mobile_image_url||''}/>
    <label>Image alt text<input name="alt_text" defaultValue={editing?.alt_text||''}/></label>
    <label>Button text<input name="cta_label" defaultValue={editing?.cta_label||''}/></label>
    <label>Button URL<input name="cta_url" defaultValue={editing?.cta_url||''}/></label>
    <label>Display order<input type="number" name="sort_order" defaultValue={editing?.sort_order??(heroPreset?10:bannerPreset?20:100)}/></label>
    <label>Start date/time<input type="datetime-local" name="starts_at" defaultValue={editing?.starts_at?String(editing.starts_at).slice(0,16):""}/></label>
    <label>End date/time<input type="datetime-local" name="ends_at" defaultValue={editing?.ends_at?String(editing.ends_at).slice(0,16):""}/></label>
    <p>Leave scheduling blank to keep this content available whenever it is active.</p>
    <label><input type="checkbox" name="is_active" defaultChecked={editing?.is_active??true}/> Active</label>
    <div className="result-actions"><button className="button" type="submit">{editing?'Save Changes':'Add Content'}</button>{(editing||preset)&&<Link className="button ghost" href="/admin/site-content">Cancel</Link>}</div>
   </form>
  </div>
  <div className="admin-card"><h2>Content library</h2>
   {!items.length?<p>No site content yet. Add your first hero, banner or background above.</p>:
    <div className="admin-list">{items.map((item:any)=><article key={item.id} className="admin-row">
     <div><b>{item.title||item.content_key}</b><p>{item.content_key} · {item.content_type}{item.placement?' · '+item.placement:''} · {item.is_active?'Active':'Hidden'}</p>{item.image_url&&<p>Desktop image configured</p>}{item.mobile_image_url&&<p>Mobile image configured</p>}</div>
     <div className="result-actions"><Link className="button ghost" href={'/admin/site-content?edit='+item.id}>Edit</Link><form action={removeContent}><input type="hidden" name="content_id" value={item.id}/><button className="button ghost" type="submit">Delete</button></form></div>
    </article>)}</div>}
  </div>
 </section></main>
}
