export type PnlRevenueRow={revenue_type:string;gross_cents:number;fee_cents:number;status:string;occurred_at:string;currency?:string}
export type PnlExpenseRow={category:string;amount_cents:number;incurred_at:string;currency?:string}
export function pnlSummary(revenue:PnlRevenueRow[],expenses:PnlExpenseRow[],from:string,to:string,currency='USD'){
 const reportCurrency=currency.toUpperCase(),start=new Date(from+'T00:00:00Z'),end=new Date(to+'T23:59:59.999Z')
 const datedRevenue=revenue.filter(x=>!['refunded','void'].includes(x.status)&&new Date(x.occurred_at)>=start&&new Date(x.occurred_at)<=end)
 const datedExpenses=expenses.filter(x=>x.incurred_at>=from&&x.incurred_at<=to)
 const rr=datedRevenue.filter(x=>(x.currency||reportCurrency).toUpperCase()===reportCurrency),ee=datedExpenses.filter(x=>(x.currency||reportCurrency).toUpperCase()===reportCurrency)
 const grossCents=rr.reduce((s,x)=>s+Number(x.gross_cents||0),0),feeCents=rr.reduce((s,x)=>s+Number(x.fee_cents||0),0),netRevenueCents=grossCents-feeCents,expenseCents=ee.reduce((s,x)=>s+Number(x.amount_cents||0),0),profitCents=netRevenueCents-expenseCents
 const revenueByStream=new Map<string,number>();for(const x of rr)revenueByStream.set(x.revenue_type,(revenueByStream.get(x.revenue_type)||0)+Number(x.gross_cents||0)-Number(x.fee_cents||0))
 const expensesByCategory=new Map<string,number>();for(const x of ee)expensesByCategory.set(x.category,(expensesByCategory.get(x.category)||0)+Number(x.amount_cents||0))
 return {currency:reportCurrency,grossCents,feeCents,netRevenueCents,expenseCents,profitCents,profitMargin:netRevenueCents>0?profitCents/netRevenueCents:null,revenueTransactions:rr.length,expenseRecords:ee.length,excludedCurrencyRows:(datedRevenue.length-rr.length)+(datedExpenses.length-ee.length),revenueByStream:[...revenueByStream].sort((a,b)=>b[1]-a[1]),expensesByCategory:[...expensesByCategory].sort((a,b)=>b[1]-a[1])}
}
