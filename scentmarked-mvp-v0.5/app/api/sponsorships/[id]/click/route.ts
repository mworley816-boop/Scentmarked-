import { createServiceClient } from '@/lib/supabase/service'

export const dynamic='force-dynamic'
const safeDestination=(value:unknown)=>{try{const u=new URL(String(value||''));return ['http:','https:'].includes(u.protocol)?u.toString():null}catch{return null}}

export async function GET(_:Request,{params}:{params:Promise<{id:string}>}){
 const id=Number((await params).id)
 if(!Number.isInteger(id)||id<=0)return new Response('Not found',{status:404})
 try{
  const s=createServiceClient(),now=new Date().toISOString()
  const {data:campaign}=await s.from('sponsorship_campaigns').select('id,placement,status,starts_at,ends_at,destination_url').eq('id',id).maybeSingle()
  const destination=safeDestination(campaign?.destination_url)
  if(!campaign||!destination||campaign.status!=='active'||(campaign.starts_at&&campaign.starts_at>now)||(campaign.ends_at&&campaign.ends_at<now))return new Response('Not found',{status:404})
  await s.from('sponsorship_events').insert({campaign_id:id,event_type:'click',placement:campaign.placement})
  return Response.redirect(destination,302)
 }catch{return new Response('Not found',{status:404})}
}
