export type PnlRevenueRow={revenue_type:string;gross_cents:number;fee_cents:number;status:string;occurred_at:string}
export type PnlExpenseRow={category:string;amount_cents:number;incurred_at:string}
export function pnlSummary(revenue:PnlRevenueRow[],expenses:PnlExpenseRow[],from:string,to:string){
 const start=new Date(from+'T00:00:00Z'),end=new Date(to+'T23:59:59.999Z')
 const rr=revenue.filter(x=>!['refunded','void'].includes(x.status)&&new Date(x.occurred_at)>=start&&new Date(x.occurred_at)<=end)
 const ee=expenses.filter(x=>x.incurred_at>=from&&x.incurred_at<=to)
 const grossCents=rr.reduce((s,x)=>s+Number(x.gross_cents||0),0),feeCents=rr.reduce((s,x)=>s+Number(x.fee_cents||0),0),netRevenueCents=grossCents-feeCents,expenseCents=ee.reduce((s,x)=>s+Number(x.amount_cents||0),0),profitCents=netRevenueCents-expenseCents
 const revenueByStream=new Map<string,number>();for(const x of rr)revenueByStream.set(x.revenue_type,(revenueByStream.get(x.revenue_type)||0)+Number(x.gross_cents||0)-Number(x.fee_cents||0))
 const expensesByCategory=new Map<string,number>();for(const x of ee)expensesByCategory.set(x.category,(expensesByCategory.get(x.category)||0)+Number(x.amount_cents||0))
 return {grossCents,feeCents,netRevenueCents,expenseCents,profitCents,profitMargin:netRevenueCents?profitCents/netRevenueCents:0,revenueTransactions:rr.length,expenseRecords:ee.length,revenueByStream:[...revenueByStream].sort((a,b)=>b[1]-a[1]),expensesByCategory:[...expensesByCategory].sort((a,b)=>b[1]-a[1])}
}
