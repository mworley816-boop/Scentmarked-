export type ProfitRevenueRow={gross_cents:number;fee_cents:number;status:string;occurred_at:string}
export type ProfitExpenseRow={category:string;amount_cents:number;incurred_at:string}
export function monthlyProfitHistory(revenue:ProfitRevenueRow[],expenses:ProfitExpenseRow[],months=12,now=new Date()){
 const out=[] as {month:string;revenueCents:number;expenseCents:number;profitCents:number;margin:number|null;topExpenseCategory:string|null;topExpenseCents:number}[]
 for(let offset=months-1;offset>=0;offset--){
  const start=new Date(Date.UTC(now.getUTCFullYear(),now.getUTCMonth()-offset,1)),end=new Date(Date.UTC(start.getUTCFullYear(),start.getUTCMonth()+1,1))
  const rr=revenue.filter(x=>!['refunded','void'].includes(x.status)&&new Date(x.occurred_at)>=start&&new Date(x.occurred_at)<end)
  const ee=expenses.filter(x=>{const d=new Date(x.incurred_at+'T00:00:00Z');return d>=start&&d<end})
  const revenueCents=rr.reduce((s,x)=>s+Number(x.gross_cents||0)-Number(x.fee_cents||0),0),expenseCents=ee.reduce((s,x)=>s+Number(x.amount_cents||0),0),profitCents=revenueCents-expenseCents
  const cats=new Map<string,number>();for(const x of ee)cats.set(x.category,(cats.get(x.category)||0)+Number(x.amount_cents||0));const top=[...cats].sort((a,b)=>b[1]-a[1])[0]
  out.push({month:start.toISOString().slice(0,7),revenueCents,expenseCents,profitCents,margin:revenueCents?profitCents/revenueCents:null,topExpenseCategory:top?.[0]||null,topExpenseCents:top?.[1]||0})
 }
 return out
}
