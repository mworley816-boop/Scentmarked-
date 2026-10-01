import { createClient } from '@/lib/supabase/server'

export async function getActiveSiteImage(contentKey:string){
 try{
  const s=await createClient()
  const {data,error}=await s.from('site_content').select('image_url,alt_text,starts_at,ends_at').eq('content_key',contentKey).eq('is_active',true).maybeSingle()
  if(error||!data?.image_url)return null
  const now=Date.now()
  if(data.starts_at&&new Date(data.starts_at).getTime()>now)return null
  if(data.ends_at&&new Date(data.ends_at).getTime()<now)return null
  return {image_url:data.image_url as string,alt_text:(data.alt_text as string|null)||null}
 }catch{return null}
}

export async function getDefaultPerfumeImage(){
 return getActiveSiteImage('perfume_fallback')
}
