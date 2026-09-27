import Link from 'next/link';
import {createClient} from '@/lib/supabase/server';
const cravings=[['✿','Vanilla'],['☁','Marshmallow'],['●','Strawberry'],['◆','Caramel'],['▣','Chocolate'],['✹','Fruity'],['❀','Floral'],['⌁','Woody'],['❧','Fresh'],['◈','Amber']];
const preferred=['Angham','Nebras','Eclaire','Yum Boujee Marshmallow | 81','Khamrah','Goddess'];
export default async function Home(){
 const s=await createClient();
 const {data}=await s.from('perfumes').select('id,name,slug,concentration,brands(name),perfume_notes(notes(name))').eq('status','published').in('name',preferred).limit(6);
 const featured:any[]=[...(data||[])].sort((a:any,b:any)=>preferred.indexOf(a.name)-preferred.indexOf(b.name));
 return <main className="home">
  <section className="editorial-hero">
   <div className="hero-copy"><p className="eyebrow">FRAGRANCES MAKE MEMORIES</p><h1>Find your next<br/>signature scent.</h1><p>Search, compare and discover fragrances that match your taste, your vibe, and your budget.</p>
   <form className="hero-search" action="/discover"><span>⌕</span><input name="q" aria-label="Search fragrances" placeholder="Search perfume, brand, note, or scent…"/></form>
   <div className="hero-buttons"><Link className="button" href="/matches">FIND A MATCH　→</Link><Link className="button ghost" href="/compare">⇄　COMPARE SCENTS</Link></div></div>
   <div className="hero-still-life"><div className="bottle b1"><i>KAY<br/>ALI</i></div><div className="bottle b2"><i>ANGHAM</i></div><div className="bottle b3"><i>GODDESS</i></div><div className="vanilla-flower">✿</div><div className="hero-note">Sweet scents.<br/>Bigger connections.</div></div>
  </section>
  <section className="craving-section"><div className="section-head"><p className="section-label">WHAT ARE YOU CRAVING?</p><Link className="text-link" href="/discover">EXPLORE ALL NOTES　→</Link></div><div className="craving-row">{cravings.map(([icon,name])=><Link href={'/discover?note='+encodeURIComponent(name.toLowerCase())} key={name}><span>{icon}</span><b>{name}</b></Link>)}</div></section>
  <section className="trending"><div className="section-head"><div><h2>Trending Fragrances</h2><p>Most viewed. Most compared. Most loved right now.</p></div><Link className="text-link" href="/discover">VIEW ALL　→</Link></div>
   <div className="trend-grid">{featured.map((p:any)=>{const notes=(p.perfume_notes||[]).map((x:any)=>x.notes?.name).filter(Boolean);return <article className="trend-card" key={p.id}><div className="product-art"><div className="mini-bottle">{p.name.slice(0,1)}</div><span>♡</span></div><small>{p.brands?.name}</small><h3>{p.name}</h3><p className="stars">★ <b>4.6</b> <em>community</em></p><div className="note-chips">{notes.slice(0,3).map((n:string)=><span key={n}>{n}</span>)}</div><Link className="view-scent" href={'/perfume/'+p.slug}>VIEW SCENT</Link></article>})}</div>
  </section>
  <section className="home-actions"><Link href="/matches"><h2>Find a Match</h2><p>Love a fragrance? Discover scents with similar DNA.</p><b>SEARCH A FRAGRANCE　→</b></Link><Link href="/compare"><h2>Compare Scents</h2><p>See notes and scent profiles side by side.</p><b>COMPARE NOW　→</b></Link><Link href="/collection"><h2>Build Your Collection</h2><p>Save what you love, track what you've tried.</p><b>JOIN FREE　→</b></Link></section>
  <section className="brand-strip"><p>EXPLORE TOP BRANDS</p><div><span>Lattafa</span><span>KAYALI</span><span>BURBERRY</span><span>Yves Saint Laurent</span><span>DIOR</span><span>TOM FORD</span><span>LANCÔME</span></div></section>
 </main>
}