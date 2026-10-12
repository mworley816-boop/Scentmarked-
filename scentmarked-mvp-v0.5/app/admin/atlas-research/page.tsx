import Link from 'next/link'
import {redirect} from 'next/navigation'
import {createClient} from '@/lib/supabase/server'

export const metadata={title:'Atlas Research Queue',robots:{index:false,follow:false}}
export const dynamic='force-dynamic'

const statuses=['all','needs_source_review','duplicate','approved','rejected'] as const
type Status=(typeof statuses)[number]

export default async function AtlasResearchQueue({searchParams}:{searchParams:Promise<{status?:string}>}){
 const s=await createClient()
 const {data:{user},error:authError}=await s.auth.getUser()
 if(authError||!user)redirect('/login?next=/admin/atlas-research')
 const {data:profile,error:profileError}=await s.from('profiles').select('is_admin').eq('id',user.id).maybeSingle()
 if(profileError||profile?.is_admin!==true)redirect('/discover')
 const params=await searchParams
 const status:Status=statuses.includes(params.status as Status)?params.status as Status:'all'
 let query=s.from('atlas_research_queue').select('id,brand,perfume_name,manufacturer_url,source_notes,decision,status,submitted_at,reviewed_at,reviewed_by,review_note',{count:'exact'}).order('submitted_at',{ascending:false}).limit(100)
 if(status!=='all')query=query.eq('status',status)
 const {data,error,count}=await query
 return <main className="container" style={{paddingBlock:'2rem'}}>
  <Link href="/admin">← Admin Studio</Link>
  <h1>Atlas research review queue</h1>
  <p>Research is held for human verification. This page does not automatically publish perfumes.</p>
  <nav aria-label="Research status filters" className="admin-filters">
   {statuses.map(item=><Link key={item} className="button ghost" aria-current={item===status?'page':undefined} href={item==='all'?'/admin/atlas-research':'/admin/atlas-research?status='+item}>{item.replaceAll('_',' ')}</Link>)}
  </nav>
  {error?<p role="alert">Unable to load Atlas research queue. Check database access and try again.</p>:<>
   <p>{count??0} submission{count===1?'':'s'} in this view (showing up to 100)</p>
   {!data?.length?<p>No research submissions in this category yet.</p>:<div className="admin-list">{data.map(row=><article key={row.id}>
    <div><small>{row.brand}</small><h2>{row.perfume_name}</h2><p>Status: {row.status.replaceAll('_',' ')} · Submitted: {new Date(row.submitted_at).toLocaleDateString('en-US',{timeZone:'UTC'})}</p>
    <p>Original decision: {row.decision.replaceAll('_',' ')}</p>
    <p>Notes: {Array.isArray(row.source_notes)?row.source_notes.join(', '):'Unavailable'}</p>
    {row.review_note&&<p>Review: {row.review_note}</p>}
    <a href={row.manufacturer_url} target="_blank" rel="noopener noreferrer">Inspect submitted source ↗</a>
    </div>
   </article>)}</div>}
  </>}
 </main>
}
