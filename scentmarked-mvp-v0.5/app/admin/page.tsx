import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function Admin(){
  const s=await createClient()
  const {data:{user}}=await s.auth.getUser()
  if(!user) redirect('/login?next=/admin')
  const {data:profile}=await s.from('profiles').select('is_admin').eq('id',user.id).maybeSingle()
  if(!profile?.is_admin) redirect('/discover')
  return <main><section><p className="eyebrow">SCENTMARKED STUDIO</p><h2>Admin Dashboard</h2><div className="grid"><div className="card"><h3>Add a fragrance</h3><p>Create a perfume record and publish it to discovery.</p><a className="button" href="/admin/perfumes/new">Add Fragrance</a></div><div className="card"><h3>Catalog workflow</h3><p>Draft → add notes and accords → verify relationships → publish.</p></div></div></section></main>
}
