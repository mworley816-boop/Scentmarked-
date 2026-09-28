import { createClient } from '@/lib/supabase/server'

const csv=(value:any)=>'"'+String(value??'').replaceAll('"','""')+'"'

export async function GET(request:Request){
 const s=await createClient()
 const {data:{user}}=await s.auth.getUser()
 if(!user)return new Response('Unauthorized',{status:401})
 const {data:profile}=await s.from('profiles').select('is_admin').eq('id',user.id).maybeSingle()
 if(profile?.is_admin!==true)return new Response('Forbidden',{status:403})

 const url=new URL(request.url)
 const period=['7','30','all'].includes(url.searchParams.get('period')||'')?url.searchParams.get('period')||'30':'30'
 const cutoff=period==='7'?new Date(Date.now()-7*24*60*60*1000).toISOString():period==='30'?new Date(Date.now()-30*24*60*60*1000).toISOString():null
 const rows:any[]=[]
 const pageSize=1000
 for(let from=0;;from+=pageSize){
  let query=s.from('affiliate_clicks').select('offer_id,perfume_id,placement,clicked_at').order('clicked_at',{ascending:false})
  if(cutoff)query=query.gte('clicked_at',cutoff)
  const result=await query.range(from,from+pageSize-1)
  if(result.error)return new Response('Could not load affiliate clicks',{status:500})
  const batch=result.data||[];rows.push(...batch);if(batch.length<pageSize)break
 }
 const offerIds=[...new Set(rows.map(x=>x.offer_id).filter(Boolean))]
 const perfumeIds=[...new Set(rows.map(x=>x.perfume_id).filter(Boolean))]
 const [{data:offers},{data:perfumes}]=await Promise.all([
  offerIds.length?s.from('perfume_affiliate_offers').select('id,merchant_name,label').in('id',offerIds):Promise.resolve({data:[] as any[]}),
  perfumeIds.length?s.from('perfumes').select('id,name,slug,brands(name)').in('id',perfumeIds):Promise.resolve({data:[] as any[]})
 ])
 const offerMap=new Map((offers||[]).map((x:any)=>[String(x.id),x]))
 const perfumeMap=new Map((perfumes||[]).map((x:any)=>[String(x.id),x]))
 const lines=[['clicked_at','period','perfume','brand','slug','merchant','offer_label','placement','offer_id','perfume_id'].map(csv).join(',')]
 for(const row of rows){
  const offer:any=offerMap.get(String(row.offer_id)),perfume:any=perfumeMap.get(String(row.perfume_id))
  lines.push([row.clicked_at,period,perfume?.name,perfume?.brands?.name,perfume?.slug,offer?.merchant_name,offer?.label,row.placement,row.offer_id,row.perfume_id].map(csv).join(','))
 }
 return new Response('\uFEFF'+lines.join('\n'),{headers:{'Content-Type':'text/csv; charset=utf-8','Content-Disposition':`attachment; filename="scentmarked-affiliate-clicks-${period}.csv"`,'Cache-Control':'private, no-store'}})
}
