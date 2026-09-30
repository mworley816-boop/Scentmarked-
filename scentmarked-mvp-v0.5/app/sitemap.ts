import type { MetadataRoute } from 'next'
import { createClient } from '@/lib/supabase/server'
import { siteUrl } from '@/lib/site'

export default async function sitemap():Promise<MetadataRoute.Sitemap>{
 const base=siteUrl,now=new Date()
 const staticRoutes=['','/discover','/matches','/compare','/notes','/accords','/brands','/community','/about','/privacy','/terms','/affiliate-disclosure','/community-guidelines','/methodology','/contact']
 const entries:MetadataRoute.Sitemap=staticRoutes.map(route=>({url:base+route,lastModified:now,changeFrequency:'weekly',priority:route===''?1:.8}))
 try{
  const s=await createClient()
  const perfumes=await s.from('perfumes').select('slug,updated_at').eq('status','published')
  if(!perfumes.error)entries.push(...(perfumes.data||[]).map(p=>({url:base+'/perfume/'+p.slug,lastModified:p.updated_at?new Date(p.updated_at):now,changeFrequency:'weekly' as const,priority:.7})))
  const brands=await s.from('brands').select('slug,perfumes!inner(id)').eq('perfumes.status','published')
  if(!brands.error)entries.push(...(brands.data||[]).filter((b:any)=>(b.perfumes||[]).length).map((b:any)=>({url:base+'/brand/'+b.slug,lastModified:now,changeFrequency:'monthly' as const,priority:.6})))
  const accords=await s.from('accords').select('slug,perfume_accords!inner(perfumes!inner(id,status))').eq('perfume_accords.perfumes.status','published')
  if(!accords.error)entries.push(...(accords.data||[]).filter((a:any)=>(a.perfume_accords||[]).length).map((a:any)=>({url:base+'/accord/'+a.slug,lastModified:now,changeFrequency:'monthly' as const,priority:.6})))
  const notes=await s.from('notes').select('slug,perfume_notes!inner(perfumes!inner(id,status))').eq('perfume_notes.perfumes.status','published')
  if(!notes.error)entries.push(...(notes.data||[]).filter((n:any)=>(n.perfume_notes||[]).length).map((n:any)=>({url:base+'/note/'+n.slug,lastModified:now,changeFrequency:'monthly' as const,priority:.6})))
 }catch{}
 return entries
}
