import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { filterRevenuePeriod, normalizeRevenuePeriod } from '@/lib/revenue-period'

const csv=(v:any)=>{const s=String(v??'');return /[",\n]/.test(s)?'"'+s.replaceAll('"','""')+'"':s}

export async function GET(request:NextRequest){
 const s=await createClient(),{data:{user}}=await s.auth.getUser()
 if(!user)return NextResponse.redirect(new URL('/login?next=/admin/monetization',request.url))
 const {data:profile}=await s.from('profiles').select('is_admin').eq('id',user.id).maybeSingle()
 if(profile?.is_admin!==true)return NextResponse.redirect(new URL('/discover',request.url))
 const period=normalizeRevenuePeriod(request.nextUrl.searchParams.get('period'))
 const service=createServiceClient()
 const {data,error}=await service.from('monetization_transactions').select('id,revenue_type,source_name,external_id,gross_cents,fee_cents,currency,status,occurred_at,affiliate_merchant,affiliate_placement,perfume_id').order('occurred_at',{ascending:false}).limit(10000)
 if(error)return new NextResponse('Revenue export unavailable',{status:500})
 const rows=filterRevenuePeriod(data||[],period)
 const header=['id','revenue_type','source_name','external_id','gross','fees','net','currency','status','occurred_at','affiliate_merchant','affiliate_placement','perfume_id']
 const lines=[header.join(','),...rows.map((x:any)=>[x.id,x.revenue_type,x.source_name,x.external_id,(Number(x.gross_cents||0)/100).toFixed(2),(Number(x.fee_cents||0)/100).toFixed(2),((Number(x.gross_cents||0)-Number(x.fee_cents||0))/100).toFixed(2),x.currency,x.status,x.occurred_at,x.affiliate_merchant,x.affiliate_placement,x.perfume_id].map(csv).join(','))]
 return new NextResponse(lines.join('\n'),{headers:{'content-type':'text/csv; charset=utf-8','content-disposition':`attachment; filename="scentmarked-revenue-${period}.csv"`,'cache-control':'private, no-store'}})
}
