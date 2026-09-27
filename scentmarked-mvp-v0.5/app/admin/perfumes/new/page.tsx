import {createClient} from '@/lib/supabase/server'
import {redirect} from 'next/navigation'

async function requireAdmin(){
  const s=await createClient()
  const {data:{user}}=await s.auth.getUser()
  if(!user) redirect('/login?next=/admin/perfumes/new')
  const {data:profile}=await s.from('profiles').select('is_admin').eq('id',user.id).maybeSingle()
  if(!profile?.is_admin) redirect('/discover')
  return s
}
function slug(x:string){return x.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'')}
async function add(formData:FormData){
  'use server'
  const s=await requireAdmin()
  const brand=String(formData.get('brand')||'').trim(),name=String(formData.get('name')||'').trim()
  if(!brand||!name)return
  let {data:b}=await s.from('brands').select('id').eq('slug',slug(brand)).maybeSingle()
  if(!b){const x=await s.from('brands').insert({name:brand,slug:slug(brand)}).select('id').single();b=x.data}
  await s.from('perfumes').insert({brand_id:b?.id,name,slug:slug(name),description:String(formData.get('description')||''),concentration:String(formData.get('concentration')||''),status:String(formData.get('status')||'draft')})
  redirect('/discover')
}
export default async function New(){
  await requireAdmin()
  return <main><section><p className="eyebrow">ADMIN · NEW FRAGRANCE</p><h2>Add a fragrance</h2><form action={add} className="form"><label>Brand<input name="brand" required/></label><label>Fragrance name<input name="name" required/></label><label>Concentration<input name="concentration"/></label><label>Description<textarea name="description" rows={5}/></label><label>Status<select name="status"><option value="draft">Draft</option><option value="published">Published</option></select></label><button className="button">Save Fragrance</button></form></section></main>
}
