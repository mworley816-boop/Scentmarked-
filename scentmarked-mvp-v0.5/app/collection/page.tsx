import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import MarkScent from '@/components/mark-scent'

const labels:Record<string,string>={owned:'Own It',want:'Want to Try',tried:'Tried',favorite:'Favorites'}
const valid=new Set(Object.keys(labels))
export const metadata={title:'My Marks',robots:{index:false,follow:false}}

export default async function Collection({searchParams}:{searchParams:Promise<{status?:string}>}){
 const q=await searchParams,s=await createClient();let user:any=null
 try{const auth=await s.auth.getUser();user=auth.data.user}catch{}
 if(!user)redirect('/login?next=/collection')
 let rows:any[]=[],loadError=false
 try{const result=await s.from('collection_items').select('status,created_at,perfumes(id,name,slug,brands(name))').eq('user_id',user.id).order('created_at',{ascending:false});if(result.error)loadError=true;else rows=result.data||[]}catch{loadError=true}
 const grouped=new Map<string,{p:any,statuses:string[]}>()
 for(const row of rows){const p:any=row.perfumes;if(!p)continue;const old=grouped.get(p.id)||{p,statuses:[]};if(!old.statuses.includes(row.status))old.statuses.push(row.status);grouped.set(p.id,old)}
 const filter=q.status&&valid.has(q.status)?q.status:'',items=[...grouped.values()].filter(x=>!filter||x.statuses.includes(filter))
 const counts=Object.fromEntries(Object.keys(labels).map(k=>[k,rows.filter(x=>x.status===k).length]))
 return <main><section className="collection-page"><div className="section-head"><div><p className="eyebrow">MY MARKS</p><h1 className="page-title">My Collection</h1><p className="lede">Keep track of what you own, what you want, what you've tried, and your favorites.</p></div><Link className="button" href="/discover">+ Add Fragrance</Link></div>
 {loadError?<div className="empty-state"><h2>Your Marks couldn't be loaded.</h2><p>Please refresh in a moment.</p></div>:<>
 <nav className="collection-tabs" aria-label="Collection filters"><Link className={!filter?'active':''} href="/collection">All ({grouped.size})</Link>{Object.entries(labels).map(([k,v])=><Link className={filter===k?'active':''} href={'/collection?status='+k} key={k}>{v} ({counts[k]})</Link>)}</nav>
 {items.length?<div className="collection-grid">{items.map(({p,statuses})=><article className="collection-card" key={p.id}><div className="collection-bottle">{p.name.slice(0,1)}</div><small>{p.brands?.name}</small><Link href={'/perfume/'+p.slug}><h3>{p.name}</h3></Link><p>{statuses.map(x=>labels[x]||x).join(' · ')}</p><MarkScent perfumeId={p.id} initial={statuses}/></article>)}</div>:<div className="empty-state"><h2>{filter?'No fragrances in '+labels[filter]+' yet.':'No Marks yet.'}</h2><p>Explore the catalog and mark scents as you discover them.</p><Link className="button" href="/discover">Discover fragrances</Link></div>}
 </>}</section></main>
}
