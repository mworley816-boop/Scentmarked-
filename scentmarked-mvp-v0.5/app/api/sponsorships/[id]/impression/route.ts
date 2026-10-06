import { createServiceClient } from '@/lib/supabase/service'

export const dynamic='force-dynamic'

export async function POST(_:Request,{params}:{params:Promise<{id:string}>}){
 const id=Number((await params).id)
 if(!Number.isInteger(id)||id<=0)return new Response(null,{status:400})
 try{
  const s=createServiceClient(),now=new Date().toISOString()
  const {data:campaign}=await s.from('sponsorship_campaigns').select('id,placement,status,starts_at,ends_at').eq('id',id).maybeSingle()
  if(!campaign||campaign.status!=='active'||(campaign.starts_at&&campaign.starts_at>now)||(campaign.ends_at&&campaign.ends_at<now))return new Response(null,{status:404})
  await s.from('sponsorship_events').insert({campaign_id:id,event_type:'impression',placement:campaign.placement})
  return new Response(null,{status:204,headers:{'Cache-Control':'no-store'}})
 }catch{return new Response(null,{status:204,headers:{'Cache-Control':'no-store'}})}
}
