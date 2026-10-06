import { NextRequest,NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { safeCsvCell,centsAmount,financialDateRange } from '@/lib/financial-export'
export async function GET(request:NextRequest){
 const s=await createClient(),{data:{user}}=await s.auth.getUser();if(!user)return NextResponse.redirect(new URL('/login?next=/admin/monetization',request.url))
 const {data:p}=await s.from('profiles').select('is_admin').eq('id',user.id).maybeSingle();if(p?.is_admin!==true)return NextResponse.redirect(new URL('/discover',request.url))
 const {from,to}=financialDateRange(request.nextUrl.searchParams.get('from'),request.nextUrl.searchParams.get('to')),service=createServiceClient()
 const {data,error}=await service.from('monetization_expenses').select('id,category,vendor,description,amount_cents,currency,incurred_at,created_at').gte('incurred_at',from).lte('incurred_at',to).order('incurred_at',{ascending:true}).limit(10000)
 if(error)return new NextResponse('Expense export unavailable',{status:500})
 const header=['id','date','category','vendor','description','amount','currency','created_at']
 const lines=[header.join(','),...(data||[]).map((x:any)=>[x.id,x.incurred_at,x.category,x.vendor,x.description,centsAmount(x.amount_cents),x.currency,x.created_at].map(safeCsvCell).join(','))]
 return new NextResponse(lines.join('\n'),{headers:{'content-type':'text/csv; charset=utf-8','content-disposition':`attachment; filename="scentmarked-expenses-${from}-to-${to}.csv"`,'cache-control':'private, no-store'}})
}
