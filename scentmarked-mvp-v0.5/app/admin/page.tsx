import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function Admin(){
 const s=await createClient();let user:any=null
 try{const auth=await s.auth.getUser();user=auth.data.user}catch{}
 if(!user)redirect('/login?next=/admin')
 let isAdmin=false;try{const result=await s.from('profiles').select('is_admin').eq('id',user.id).maybeSingle();isAdmin=result.data?.is_admin===true}catch{}
 if(!isAdmin)redirect('/discover')
 let perfumes:any[]=[]
 try{const r=await s.from('perfumes').select('id,name,slug,status,updated_at,brands(name)').order('updated_at',{ascending:false}).limit(100);perfumes=r.data||[]}catch{}
 return <main><section className="admin-catalog"><p className="eyebrow">SCENTMARKED STUDIO</p><div className="admin-heading"><div><h1 className="page-title">Catalog Studio</h1><p>Manage fragrance records, verification and publishing.</p></div><Link className="button" href="/admin/perfumes/new">Add Fragrance</Link></div>
 <div className="admin-list">{perfumes.length?perfumes.map((p:any)=><article key={p.id}><div><small>{p.brands?.name||'Brand'}</small><h2>{p.name}</h2><span className={'status-pill '+p.status}>{p.status}</span></div><div><Link className="button ghost" href={'/perfume/'+p.slug}>View</Link><Link className="button" href={'/admin/perfumes/'+p.id+'/edit'}>Edit</Link></div></article>):<div className="empty-state"><h2>No editable fragrances found.</h2></div>}</div></section></main>
}
