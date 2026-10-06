import { NextRequest,NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { safeCsvCell,centsAmount,financialDateRange } from '@/lib/financial-export'
export async function GET(request:NextRequest){
 const s=await createClient(),{data:{user}}=await s.auth.getUser();if(!user)return NextResponse.redirect(new URL('/login?next=/admin/monetization',request.url))
 const {data:p}=await s.from('profiles').select('is_admin').eq('id',user.id).maybeSingle();if(p?.is_admin!==true)return NextResponse.redirect(new URL('/discover',request.url))
 const {from,to}=financialDateRange(request.nextUrl.searchParams.get('from'),request.nextUrl.searchParams.get('to')),service=createServiceClient(),toTs=to+'T23:59:59.999Z'
 const [tx,ex]=await Promise.all([service.from('monetization_transactions').select('revenue_type,gross_cents,fee_cents,status,occurred_at').gte('occurred_at',from+'T00:00:00Z').lte('occurred_at',toTs).limit(10000),service.from('monetization_expenses').select('category,amount_cents,incurred_at').gte('incurred_at',from).lte('incurred_at',to).limit(10000)])
 if(tx.error||ex.error)return new NextResponse('Profit and loss report unavailable',{status:500})
 const rows=(tx.data||[]).filter((x:any)=>!['refunded','void'].includes(x.status)),gross=rows.reduce((s:number,x:any)=>s+Number(x.gross_cents||0),0),fees=rows.reduce((s:number,x:any)=>s+Number(x.fee_cents||0),0),net=gross-fees,expenses=(ex.data||[]).reduce((s:number,x:any)=>s+Number(x.amount_cents||0),0),profit=net-expenses
 const byRevenue=new Map<string,number>();for(const x of rows as any[])byRevenue.set(x.revenue_type,(byRevenue.get(x.revenue_type)||0)+Number(x.gross_cents||0)-Number(x.fee_cents||0))
 const byExpense=new Map<string,number>();for(const x of (ex.data||[]) as any[])byExpense.set(x.category,(byExpense.get(x.category)||0)+Number(x.amount_cents||0))
 const lines=[['section','category','amount'].join(','),['summary','gross_revenue',centsAmount(gross)],['summary','fees',centsAmount(fees)],['summary','net_revenue',centsAmount(net)],['summary','operating_expenses',centsAmount(expenses)],['summary','operating_profit',centsAmount(profit)],...([...byRevenue].map(([k,v])=>['revenue',k,centsAmount(v)])),...([...byExpense].map(([k,v])=>['expense',k,centsAmount(v)]))].map(r=>r.map(safeCsvCell).join(','))
 return new NextResponse(lines.join('\n'),{headers:{'content-type':'text/csv; charset=utf-8','content-disposition':`attachment; filename="scentmarked-pnl-${from}-to-${to}.csv"`,'cache-control':'private, no-store'}})
}
