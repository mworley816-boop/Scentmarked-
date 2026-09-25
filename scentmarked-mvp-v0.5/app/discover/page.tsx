import Link from 'next/link';
import {createClient} from '@/lib/supabase/server';
import MarkScent from '@/components/mark-scent';

type Search = {q?:string; brand?:string; type?:string; note?:string};
const middleEastern=['Lattafa','Maison Alhambra','Paris Corner','French Avenue','Khadlaj','Swiss Arabian','Armaf','Afnan','Rasasi','Al Haramain'];
const niche=['Giardini di Toscana','Maison Francis Kurkdjian','Parfums de Marly','Xerjoff','Mancera','Montale','Kilian Paris','Nishane','Initio'];
function segment(brand:string){if(middleEastern.includes(brand)) return 'Middle Eastern'; if(niche.includes(brand)) return 'Niche'; return 'Designer';}

export default async function Discover({searchParams}:{searchParams:Promise<Search>}){
  const params=await searchParams; const s=await createClient(); const {data:{user}}=await s.auth.getUser();
  const {data:raw}=await s.from('perfumes').select('id,name,slug,description,concentration,gender_marketing,brands(name),perfume_notes(notes(name,slug))').eq('status','published').order('name');
  let marks:any[]=[]; if(user){const r=await s.from('collection_items').select('perfume_id,status').eq('user_id',user.id);marks=r.data||[]}
  const all=(raw||[]) as any[]; const brands=[...new Set(all.map(p=>p.brands?.name).filter(Boolean))].sort();
  const q=(params.q||'').trim().toLowerCase(); const note=(params.note||'').trim().toLowerCase();
  const data=all.filter(p=>{const brand=p.brands?.name||''; const notes=(p.perfume_notes||[]).map((x:any)=>x.notes?.name).filter(Boolean);
    return (!q || `${p.name} ${brand} ${notes.join(' ')}`.toLowerCase().includes(q)) && (!params.brand||brand===params.brand) && (!params.type||segment(brand)===params.type) && (!note||notes.some((n:string)=>n.toLowerCase().includes(note)));
  });
  return <main><section className="discover-head"><p className="eyebrow">SCENT LIBRARY</p><h1 className="page-title">Discover your next scent</h1><p className="lede">Search the growing Scentmarked catalog by fragrance, house, collection type or note.</p>
    <form className="filter-panel" action="/discover"><input name="q" defaultValue={params.q} placeholder="Search perfume, brand or note…"/><select name="type" defaultValue={params.type||''}><option value="">All collections</option><option>Middle Eastern</option><option>Designer</option><option>Niche</option></select><select name="brand" defaultValue={params.brand||''}><option value="">All brands</option>{brands.map(b=><option key={b}>{b}</option>)}</select><input name="note" defaultValue={params.note} placeholder="Note: vanilla, musk…"/><button className="button">Search</button><Link className="clear-filter" href="/discover">Clear</Link></form>
    <div className="catalog-meta"><strong>{data.length}</strong> fragrances shown <span>•</span> <strong>{brands.length}</strong> houses in catalog</div>
    <div className="quick-filters"><Link href="/discover?type=Middle+Eastern">Middle Eastern</Link><Link href="/discover?type=Designer">Designer</Link><Link href="/discover?type=Niche">Niche</Link><Link href="/discover?note=vanilla">Vanilla</Link><Link href="/discover?note=caramel">Caramel</Link><Link href="/discover?note=musk">Musk</Link></div>
    <div className="grid fragrance-grid">{data.map((p:any)=>{const brand=p.brands?.name||''; const notes=(p.perfume_notes||[]).map((x:any)=>x.notes?.name).filter(Boolean);return <article className="card fragrance-card" key={p.id}><div className="card-top"><span className="type-pill">{segment(brand)}</span><small>{brand}</small></div><Link href={'/perfume/'+p.slug}><h3>{p.name}</h3></Link><p className="meta-line">{[p.concentration,p.gender_marketing].filter(Boolean).join(' · ')||'Fragrance'}</p><p>{p.description||'Explore this fragrance in the Scentmarked catalog.'}</p>{notes.length>0&&<div className="note-chips">{notes.slice(0,5).map((n:string)=><span key={n}>{n}</span>)}{notes.length>5&&<span>+{notes.length-5}</span>}</div>}<div className="card-actions"><Link href={'/perfume/'+p.slug}>View scent</Link><Link href={'/matches?perfume='+p.slug}>Find matches</Link></div><MarkScent perfumeId={p.id} initial={marks.filter(m=>m.perfume_id===p.id).map(m=>m.status)}/></article>})}</div>
    {!data.length&&<div className="empty-state"><h3>No scents found</h3><p>Try clearing a filter or searching a broader note.</p><Link className="button" href="/discover">View all fragrances</Link></div>}
  </section></main>
}
