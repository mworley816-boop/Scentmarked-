import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

async function admin(next:string){
 const s=await createClient();const {data:{user}}=await s.auth.getUser()
 if(!user)redirect('/login?next='+encodeURIComponent(next))
 const {data}=await s.from('profiles').select('is_admin').eq('id',user.id).maybeSingle()
 if(data?.is_admin!==true)redirect('/discover')
 return s
}
async function save(formData:FormData){
 'use server'
 const id=String(formData.get('id')||''),next='/admin/perfumes/'+id+'/edit',s=await admin(next)
 const payload={name:String(formData.get('name')||'').trim(),description:String(formData.get('description')||'').trim(),concentration:String(formData.get('concentration')||'').trim(),release_year:Number(formData.get('release_year'))||null,country:String(formData.get('country')||'').trim()||null,status:String(formData.get('status')||'draft')}
 if(!payload.name)redirect(next+'?error='+encodeURIComponent('Fragrance name is required.'))
 const {error}=await s.from('perfumes').update(payload).eq('id',id)
 if(error)redirect(next+'?error='+encodeURIComponent(error.message))
 redirect(next+'?saved=1')
}
export default async function Edit({params,searchParams}:{params:Promise<{id:string}>,searchParams:Promise<{error?:string;saved?:string}>}){
 const {id}=await params,p=await searchParams,s=await admin('/admin/perfumes/'+id+'/edit')
 const {data:x,error}=await s.from('perfumes').select('id,name,slug,description,concentration,release_year,country,status,brands(name)').eq('id',id).maybeSingle()
 if(error||!x)redirect('/admin')
 const perfume:any=x
 return <main><section><p className="eyebrow">ADMIN · EDIT FRAGRANCE</p><h1 className="page-title">{perfume.name}</h1><p className="lede">{perfume.brands?.name} · Edit the core catalog record without changing verified note/source relationships.</p>
 {p.saved&&<div className="notice">Changes saved.</div>}{p.error&&<div className="notice error">{p.error}</div>}
 <form action={save} className="form"><input type="hidden" name="id" value={perfume.id}/><label>Fragrance name<input name="name" required defaultValue={perfume.name}/></label><label>Concentration<input name="concentration" defaultValue={perfume.concentration||''}/></label><label>Release year<input name="release_year" type="number" min="1800" max="2100" defaultValue={perfume.release_year||''}/></label><label>Country<input name="country" defaultValue={perfume.country||''}/></label><label>Description<textarea name="description" rows={7} defaultValue={perfume.description||''}/></label><label>Status<select name="status" defaultValue={perfume.status||'draft'}><option value="draft">Draft</option><option value="published">Published</option></select></label><button className="button">Save Changes</button></form>
 </section></main>
}
