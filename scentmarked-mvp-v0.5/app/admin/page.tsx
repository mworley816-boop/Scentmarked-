import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export const metadata={title:'Catalog Studio',robots:{index:false,follow:false}}
export default async function Admin({searchParams}:{searchParams:Promise<{q?:string;status?:string}>}){
 const q=await searchParams,s=await createClient();let user:any=null
 try{const auth=await s.auth.getUser();user=auth.data.user}catch{}
 if(!user)redirect('/login?next=/admin')
 let isAdmin=false;try{const result=await s.from('profiles').select('is_admin').eq('id',user.id).maybeSingle();isAdmin=result.data?.is_admin===true}catch{}
 if(!isAdmin)redirect('/discover')
 let perfumes:any[]=[],loadError=false
 try{const r=await s.from('perfumes').select('id,name,slug,status,updated_at,brands(name),perfume_notes(note_id),perfume_sources(id)').order('updated_at',{ascending:false}).limit(500);if(r.error)loadError=true;else perfumes=r.data||[]}catch{loadError=true}
 const search=(q.q||'').trim().toLowerCase(),status=q.status||''
 const data=perfumes.filter((p:any)=>(!search||(`${p.name} ${p.brands?.name||''}`).toLowerCase().includes(search))&&(!status||p.status===status))
 const incomplete=perfumes.filter((p:any)=>!(p.perfume_notes||[]).length||!(p.perfume_sources||[]).length).length
 return <main><section className="admin-catalog"><p className="eyebrow">SCENTMARKED STUDIO</p><div className="admin-heading"><div><h1 className="page-title">Catalog Studio</h1><p>Manage fragrance records, verification and publishing.</p></div><Link className="button" href="/admin/perfumes/new">Add Fragrance</Link></div>
 <div className="admin-stats"><span><b>{perfumes.length}</b>Catalog records</span><span><b>{perfumes.filter((p:any)=>p.status==='published').length}</b>Published</span><span><b>{perfumes.filter((p:any)=>p.status==='draft').length}</b>Drafts</span><span><b>{incomplete}</b>Need enrichment</span></div>
 <form action="/admin" className="admin-filters"><input name="q" defaultValue={q.q||''} placeholder="Search fragrance or brand…"/><select name="status" defaultValue={status}><option value="">All statuses</option><option value="published">Published</option><option value="draft">Draft</option></select><button className="button">Filter</button>{(search||status)&&<Link href="/admin">Clear</Link>}</form>
 {loadError?<div className="empty-state"><h2>Catalog records could not be loaded.</h2></div>:<><p className="muted">{data.length} record{data.length===1?'':'s'} shown</p><div className="admin-list">{data.length?data.map((p:any)=>{const notes=(p.perfume_notes||[]).length,sources=(p.perfume_sources||[]).length,ready=notes>0&&sources>0;return <article key={p.id}><div><small>{p.brands?.name||'Brand'}</small><h2>{p.name}</h2><div className="admin-record-meta"><span className={'status-pill '+p.status}>{p.status}</span><span className={ready?'data-ready':'data-missing'}>{ready?'✓ Verified data':`Needs ${!notes?'notes':''}${!notes&&!sources?' + ':''}${!sources?'source':''}`}</span></div></div><div><Link className="button ghost" href={'/perfume/'+p.slug}>View</Link><Link className="button" href={'/admin/perfumes/'+p.id+'/edit'}>Edit</Link></div></article>}):<div className="empty-state"><h2>No records match those filters.</h2><Link href="/admin">Clear filters →</Link></div>}</div></>}</section></main>
}
