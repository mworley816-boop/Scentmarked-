import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export default async function Notes(){
  let notes:any[]=[]
  let failed=false
  try{
    const s=await createClient()
    const result=await s.from('notes').select('id,name,slug,category').order('name')
    if(result.error) failed=true
    else notes=result.data||[]
  }catch{failed=true}
  return <main><section className="index-page">
    <div className="index-hero"><p className="eyebrow">THE NOTE LIBRARY</p><h1>Explore Fragrance Notes</h1><p>From creamy vanilla to bright citrus, discover the ingredients and impressions that shape the scents you love.</p></div>
    {failed?<div className="empty-community"><h3>Note library temporarily unavailable.</h3><p>Please try again shortly.</p></div>:
    <div className="note-index">{notes.map(n=><Link href={'/discover?note='+encodeURIComponent(String(n.name||'').toLowerCase())} key={n.id}><span>✦</span><div><h3>{n.name}</h3><p>{n.category||'Fragrance note'}</p></div></Link>)}</div>}
  </section></main>
}