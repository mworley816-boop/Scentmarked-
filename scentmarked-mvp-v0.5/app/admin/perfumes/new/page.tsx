import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

async function requireAdmin(){
 const s=await createClient();
 let user:any=null;
 try{const auth=await s.auth.getUser();user=auth.data.user}catch{}
 if(!user)redirect('/login?next=/admin/perfumes/new');
 let isAdmin=false;
 try{const result=await s.from('profiles').select('is_admin').eq('id',user.id).maybeSingle();isAdmin=result.data?.is_admin===true}catch{}
 if(!isAdmin)redirect('/discover');
 return s;
}
function slug(x:string){return x.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'')}

async function add(formData:FormData){
 'use server';
 const s=await requireAdmin();
 const brand=String(formData.get('brand')||'').trim();
 const name=String(formData.get('name')||'').trim();
 if(!brand||!name)redirect('/admin/perfumes/new?error=Brand%20and%20fragrance%20name%20are%20required');
 const brandSlug=slug(brand),perfumeSlug=slug(name);
 if(!brandSlug||!perfumeSlug)redirect('/admin/perfumes/new?error=Please%20use%20a%20valid%20brand%20and%20fragrance%20name');

 let brandId:string|undefined;
 const existing=await s.from('brands').select('id').eq('slug',brandSlug).maybeSingle();
 if(existing.error)redirect('/admin/perfumes/new?error=Could%20not%20check%20the%20brand');
 if(existing.data?.id)brandId=existing.data.id;
 else{
  const created=await s.from('brands').insert({name:brand,slug:brandSlug}).select('id').single();
  if(created.error||!created.data?.id)redirect('/admin/perfumes/new?error=Could%20not%20create%20the%20brand');
  brandId=created.data.id;
 }
 const result=await s.from('perfumes').insert({brand_id:brandId,name,slug:perfumeSlug,description:String(formData.get('description')||'').trim(),concentration:String(formData.get('concentration')||'').trim(),status:String(formData.get('status')||'draft')});
 if(result.error)redirect('/admin/perfumes/new?error='+encodeURIComponent(result.error.message));
 redirect('/discover');
}

export default async function New({searchParams}:{searchParams:Promise<{error?:string}>}){
 await requireAdmin();
 const p=await searchParams;
 return <main><section><p className="eyebrow">ADMIN · NEW FRAGRANCE</p><h1 className="page-title">Add a fragrance</h1><p className="lede">Create the core catalog record. Notes, accords and source verification can be added after the fragrance exists.</p>
  {p.error&&<div className="notice error">{p.error}</div>}
  <form action={add} className="form"><label>Brand<input name="brand" required/></label><label>Fragrance name<input name="name" required/></label><label>Concentration<input name="concentration" placeholder="Eau de Parfum"/></label><label>Description<textarea name="description" rows={5}/></label><label>Status<select name="status" defaultValue="draft"><option value="draft">Draft</option><option value="published">Published</option></select></label><button className="button">Save Fragrance</button></form>
 </section></main>;
}
