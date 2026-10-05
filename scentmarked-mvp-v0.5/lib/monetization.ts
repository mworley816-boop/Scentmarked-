export type RevenueType='affiliate'|'sponsorship'|'advertising'|'subscription'|'other'
export type RevenueStatus='pending'|'confirmed'|'paid'|'refunded'|'void'

export type MonetizationTransaction={
 revenue_type:RevenueType
 gross_cents:number
 fee_cents:number
 status:RevenueStatus
 occurred_at:string
 currency:string
}

export const netCents=(row:Pick<MonetizationTransaction,'gross_cents'|'fee_cents'>)=>Math.max(0,Number(row.gross_cents||0)-Number(row.fee_cents||0))

export function money(cents:number,currency='USD'){
 try{return new Intl.NumberFormat('en-US',{style:'currency',currency}).format(Number(cents||0)/100)}
 catch{return '$'+(Number(cents||0)/100).toFixed(2)}
}

export function monetizationSummary(rows:MonetizationTransaction[]){
 const included=rows.filter(x=>x.status!=='void'&&x.status!=='refunded')
 const gross=included.reduce((sum,x)=>sum+Number(x.gross_cents||0),0)
 const fees=included.reduce((sum,x)=>sum+Number(x.fee_cents||0),0)
 const byType=new Map<RevenueType,number>()
 for(const row of included)byType.set(row.revenue_type,(byType.get(row.revenue_type)||0)+netCents(row))
 return {grossCents:gross,feeCents:fees,netCents:Math.max(0,gross-fees),byType}
}
