import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import MarkScent from '@/components/mark-scent';

type S = { q?: string; brand?: string; type?: string; note?: string };

const middleEastern = ['Lattafa','Maison Alhambra','Paris Corner','French Avenue','Khadlaj','Swiss Arabian','Armaf','Afnan','Rasasi','Al Haramain'];
const niche = ['Giardini di Toscana','Maison Francis Kurkdjian','Parfums de Marly','Xerjoff','Mancera','Montale','Kilian Paris','Nishane','Initio'];

const segment = (brand: string) =>
  middleEastern.includes(brand) ? 'Middle Eastern' : niche.includes(brand) ? 'Niche' : 'Designer';

export default async function Discover({ searchParams }: { searchParams: Promise<S> }) {
  const p = await searchParams;
  const s = await createClient();
  const { data: raw } = await s
    .from('perfumes')
    .select('id,name,slug,description,concentration,gender_marketing,brands(name),perfume_notes(notes(name,slug))')
    .eq('status', 'published')
    .order('name');

  const all = (raw || []) as any[];
  const brands = [...new Set(all.map(x => x.brands?.name).filter(Boolean))].sort();
  const q = (p.q || '').toLowerCase();
  const note = (p.note || '').toLowerCase();
  const data = all.filter(x => {
    const brand = x.brands?.name || '';
    const notes = (x.perfume_notes || []).map((y: any) => y.notes?.name).filter(Boolean);
    return (!q || (`${x.name} ${brand} ${notes.join(' ')}`).toLowerCase().includes(q))
      && (!p.brand || brand === p.brand)
      && (!p.type || segment(brand) === p.type)
      && (!note || notes.some((z: string) => z.toLowerCase().includes(note)));
  });

  return (
    <main>
      <section className="discover-page">
        <div className="discover-banner">
          <p className="eyebrow">SCENT LIBRARY</p>
          <h1>Discover Fragrances</h1>
          <p>Explore designer, Middle Eastern and niche scents by house, note and fragrance style.</p>
          <form action="/discover">
            <span>⌕</span>
            <input name="q" defaultValue={p.q} placeholder="Search perfume, brand, note, or vibe…" />
            <button className="button">Search</button>
          </form>
        </div>

        <form id="filters" action="/discover" className="discover-tools">
          <select name="type" defaultValue={p.type || ''}>
            <option value="">All Collections</option>
            <option>Middle Eastern</option>
            <option>Designer</option>
            <option>Niche</option>
          </select>
          <select name="brand" defaultValue={p.brand || ''}>
            <option value="">All Brands</option>
            {brands.map(brand => <option key={brand} value={brand}>{brand}</option>)}
          </select>
          <input name="q" type="hidden" value={p.q || ''} />
          <input name="note" defaultValue={p.note} placeholder="Filter by note" />
          <button type="submit">Apply</button>
          <span>{data.length} scents</span>
        </form>

        <div className="discover-grid">
          {data.map(x => {
            const brand = x.brands?.name || '';
            const notes = (x.perfume_notes || []).map((y: any) => y.notes?.name).filter(Boolean);
            return (
              <article key={x.id}>
                <div className="discover-bottle">{x.name.slice(0, 1)}<i>♡</i></div>
                <small>{brand}</small>
                <Link href={'/perfume/' + x.slug}><h3>{x.name}</h3></Link>
                <p className="meta-line">{segment(brand)} · {x.concentration || 'Fragrance'}</p>
                <div className="note-chips">
                  {notes.slice(0, 4).map((n: string) => <span key={n}>{n}</span>)}
                </div>
                <Link className="view-scent" href={'/perfume/' + x.slug}>VIEW SCENT</Link>
                <MarkScent perfumeId={x.id} initial={[]} />
              </article>
            );
          })}
        </div>
      </section>
    </main>
  );
}
