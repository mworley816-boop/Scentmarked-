import Link from 'next/link';
import {createClient} from '@/lib/supabase/server';
const cravings=['Vanilla','Marshmallow','Strawberry','Caramel','Chocolate','Musk','Coffee','Amber'];
export default async function Home(){
 const s=await createClient();
 const {data}=await s.from('perfumes').select('id,name,slug,concentration,brands(name),perfume_notes(notes(name))').eq('status','published').order('created_at',{ascending:false}).limit(8);
 const featured:any[]=data||[];
 return <main>
  <section className="hero"><p className="eyebrow">FRAGRANCE DISCOVERY, MARKED BY YOU</p><h1>Know the notes. <em>Find the match.</em></h1><p>Explore designer, Middle Eastern and niche fragrance. Compare scent profiles, find alternatives, and keep track of everything you own or want.</p>
   <form className="hero-search" action="/discover"><input name="q" aria-label="Search fragrances" placeholder="Search perfume, brand, note or accord…"/><button className="button">Search scents</button></form>
   <div className="actions"><Link className="button" href="/matches">Find a Match</Link><Link className="button ghost" href="/compare">Compare Scents</Link></div>
  </section>
  <section><div className="section-head"><div><p className="eyebrow">DISCOVER BY NOTE</p><h2>What are you craving?</h2></div><Link className="text-link" href="/discover">Browse all →</Link></div><div className="chips">{cravings.map(x=><Link href={'/discover?note='+encodeURIComponent(x.toLowerCase())} key={x}>{x}</Link>)}</div></section>
  <section><div className="section-head"><div><p className="eyebrow">FROM THE LIBRARY</p><h2>Explore the catalog</h2></div><Link className="text-link" href="/discover">See all scents →</Link></div><div className="grid visual-grid">{featured.map((p:any)=>{const notes=(p.perfume_notes||[]).map((x:any)=>x.notes?.name).filter(Boolean);return <article className="visual-card" key={p.id}><div className="bottle-art"><span>{p.brands?.name?.slice(0,1)||'S'}</span></div><small>{p.brands?.name}</small><Link href={`/perfume/${p.slug}`}><h3>{p.name}</h3></Link><p>{p.concentration||'Fragrance'}</p><div className="note-chips">{notes.slice(0,3).map((n:string)=><span key={n}>{n}</span>)}</div><div className="card-actions"><Link href={`/perfume/${p.slug}`}>View scent</Link><Link href={`/matches?perfume=${p.slug}`}>Find matches</Link></div></article>})}</div></section>
  <section className="feature"><div><p className="eyebrow">SCENTMARKED MATCH</p><h2>Similarity you can understand.</h2><p>Scentmarked compares normalized notes and accords. Rare shared notes carry more weight than common ones, and sparse records are clearly treated as lower-confidence matches.</p><Link className="button" href="/matches">Try Scent Match</Link></div><div className="dna-panel"><div><span>Shared notes</span><b>weighted by rarity</b></div><div><span>Shared accords</span><b>profile similarity</b></div><div><span>Data confidence</span><b>record completeness</b></div><div><span>Community</span><b>coming next</b></div></div></section>
 </main>
}
