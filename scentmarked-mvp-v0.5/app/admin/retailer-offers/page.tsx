import Link from 'next/link'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { validAffiliateUrl } from '@/lib/affiliate-tracking'

export const metadata = { title: 'Retailer Offers | Scentmarked Studio', robots: { index: false, follow: false } }

async function requireAdmin() {
  const db = await createClient()
  const { data: { user } } = await db.auth.getUser()
  if (!user) redirect('/login?next=/admin/retailer-offers')
  const { data: profile } = await db.from('profiles').select('is_admin').eq('id', user.id).maybeSingle()
  if (profile?.is_admin !== true) redirect('/discover')
  return db
}

async function saveOffer(form: FormData) {
  'use server'
  const db = await requireAdmin()
  const perfume_id = String(form.get('perfume_id') || '')
  const merchant_name = String(form.get('merchant_name') || '').trim()
  const affiliate_url = String(form.get('affiliate_url') || '').trim()
  const label = String(form.get('label') || '').trim()
  if (!/^[0-9a-f-]{36}$/i.test(perfume_id) || !merchant_name || merchant_name.length > 100 || !validAffiliateUrl(affiliate_url) || label.length > 180) {
    redirect('/admin/retailer-offers?error=invalid')
  }
  const { data: perfume } = await db.from('perfumes').select('id').eq('id', perfume_id).eq('status', 'published').maybeSingle()
  if (!perfume) redirect('/admin/retailer-offers?error=perfume')
  // New offers are always drafts. Only explicit approval makes a link public.
  const { error } = await db.from('perfume_affiliate_offers').insert({
    perfume_id, merchant_name, affiliate_url, label: label || null,
    is_active: false, currency: 'USD', priority: 100
  })
  if (error) redirect('/admin/retailer-offers?error=save')
  revalidatePath('/admin/retailer-offers')
  redirect('/admin/retailer-offers?saved=1')
}

async function setApproval(form: FormData) {
  'use server'
  const db = await requireAdmin()
  const id = Number(form.get('id'))
  const approved = form.get('approved') === 'true'
  if (!Number.isSafeInteger(id) || id <= 0) redirect('/admin/retailer-offers?error=invalid')
  const { error } = await db.from('perfume_affiliate_offers').update({ is_active: approved }).eq('id', id)
  if (error) redirect('/admin/retailer-offers?error=save')
  revalidatePath('/admin/retailer-offers')
  revalidatePath('/perfume/[slug]', 'page')
  redirect('/admin/retailer-offers?updated=1')
}

export default async function RetailerOffers({ searchParams }: { searchParams: Promise<{error?: string; saved?: string; updated?: string; view?: string}> }) {
  const db = await requireAdmin()
  const params = await searchParams
  const [perfumeResult, offerResult] = await Promise.all([
    db.from('perfumes').select('id,name,brands(name)').eq('status', 'published').order('name').limit(1000),
    db.from('perfume_affiliate_offers').select('id,perfume_id,merchant_name,affiliate_url,label,is_active,created_at').order('created_at', { ascending: false }).limit(200)
  ])
  const perfumes = perfumeResult.data || []
  const offers = offerResult.data || []
  const view = params.view === 'published' ? 'published' : params.view === 'all' ? 'all' : 'pending'
  const visibleOffers = offers.filter((o: any) => view === 'all' || (view === 'published' ? o.is_active : !o.is_active))
  const pendingCount = offers.filter((o: any) => !o.is_active).length
  const names = new Map(perfumes.map((p: any) => [p.id, String(p.brands?.name || '') + ' — ' + p.name]))
  return <main className="admin-catalog">
    <p className="eyebrow">SCENTMARKED STUDIO</p>
    <div className="admin-heading"><div><h1 className="page-title">Retailer Offer Approval</h1><p>Add verified product links as drafts, then approve them for public display. Atlas research should use the same approval process.</p></div><Link className="button ghost" href="/admin">Admin Studio</Link></div>
    {params.error && <p role="alert">Could not save: {params.error === 'invalid' ? 'Check the perfume, retailer and secure product URL.' : params.error === 'perfume' ? 'Select a published perfume.' : 'Database rejected the change. Check admin permissions.'}</p>}
    {(params.saved || params.updated) && <p role="status">Offer saved successfully.</p>}
    <section><h2>Add a retailer offer (draft)</h2>
      <form action={saveOffer} className="admin-filters">
        <label>Perfume <select name="perfume_id" required defaultValue=""><option value="" disabled>Select perfume</option>{perfumes.map((p: any) => <option key={p.id} value={p.id}>{names.get(p.id)}</option>)}</select></label>
        <label>Retailer <input name="merchant_name" required maxLength={100} placeholder="Retailer name" /></label>
        <label>Verified product URL <input name="affiliate_url" type="url" required placeholder="https://…" /></label>
        <label>Offer label <input name="label" maxLength={180} placeholder="Optional size or concentration" /></label>
        <button className="button" type="submit">Save as draft</button>
      </form>
      <p className="muted">Only enter verified product URLs. Affiliate tracking parameters must come from an approved partnership; saving a draft does not publish it.</p>
    </section>
    <section><h2>Review retailer offers</h2>
      <nav aria-label="Retailer offer filters" style={{display:'flex',gap:'0.75rem',flexWrap:'wrap',marginBottom:'1rem'}}>
        <Link href="/admin/retailer-offers?view=pending" aria-current={view === 'pending' ? 'page' : undefined}>Pending review ({pendingCount})</Link>
        <Link href="/admin/retailer-offers?view=published" aria-current={view === 'published' ? 'page' : undefined}>Published</Link>
        <Link href="/admin/retailer-offers?view=all" aria-current={view === 'all' ? 'page' : undefined}>All offers ({offers.length})</Link>
        <Link href="/admin/atlas-retailer-intake">Import Atlas research</Link>
      </nav>
      {offerResult.error && <p role="alert">Offers could not be loaded.</p>}
      {!offerResult.error && visibleOffers.length === 0 && <p>No offers in this view. Choose another filter or add a verified draft above.</p>}
      <div className="admin-list">{visibleOffers.map((o: any) => <article key={o.id}>
        <div><small>{o.is_active ? 'PUBLIC · APPROVED' : 'DRAFT · NOT PUBLIC'}</small>
          <h3>{names.get(o.perfume_id) || o.perfume_id}</h3><p>{o.merchant_name}{o.label ? ' · ' + o.label : ''}</p>
          <a href={o.affiliate_url} target="_blank" rel="noopener noreferrer">Inspect retailer product ↗</a>
        </div>
        <form action={setApproval}><input type="hidden" name="id" value={o.id} /><input type="hidden" name="approved" value={String(!o.is_active)} /><button className="button ghost" type="submit">{o.is_active ? 'Deactivate' : 'Approve & publish'}</button></form>
      </article>)}</div>
    </section>
  </main>
}
