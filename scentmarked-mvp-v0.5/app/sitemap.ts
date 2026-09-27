import type { MetadataRoute } from 'next';
import { createClient } from '@/lib/supabase/server';

export default async function sitemap():Promise<MetadataRoute.Sitemap>{
 const base='https://scentmarked.m-worley816.workers.dev';
 const now=new Date();
 const staticRoutes=['','/discover','/matches','/compare','/notes','/brands','/community'];
 const entries:MetadataRoute.Sitemap=staticRoutes.map(route=>({url:base+route,lastModified:now,changeFrequency:'weekly',priority:route===''?1:.8}));
 try{
  const s=await createClient();
  const perfumes=await s.from('perfumes').select('slug,updated_at').eq('status','published');
  if(!perfumes.error){
   entries.push(...(perfumes.data||[]).map(p=>({url:base+'/perfume/'+p.slug,lastModified:p.updated_at?new Date(p.updated_at):now,changeFrequency:'weekly' as const,priority:.7})));
  }
  const brands=await s.from('brands').select('name');
  if(!brands.error){
   entries.push(...(brands.data||[]).map(b=>({url:base+'/discover?brand='+encodeURIComponent(b.name),lastModified:now,changeFrequency:'monthly' as const,priority:.5})));
  }
 }catch{}
 return entries;
}
