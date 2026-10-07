export type ExpenseRow={category:string;amount_cents:number;incurred_at:string}
export function profitabilityMetrics(revenueNetCents:number,expenses:ExpenseRow[],now=new Date()){
 const start=new Date(Date.UTC(now.getUTCFullYear(),now.getUTCMonth(),1)),end=new Date(Date.UTC(now.getUTCFullYear(),now.getUTCMonth()+1,1))
 const current=expenses.filter(x=>{const d=new Date(x.incurred_at+'T00:00:00Z');return d>=start&&d<end})
 const expenseCents=current.reduce((s,x)=>s+Number(x.amount_cents||0),0),profitCents=Number(revenueNetCents||0)-expenseCents
 const byCategory=new Map<string,number>();for(const x of current)byCategory.set(x.category,(byCategory.get(x.category)||0)+Number(x.amount_cents||0))
 return {expenseCents,profitCents,profitMargin:revenueNetCents>0?profitCents/revenueNetCents:null,expenses:current.length,byCategory:[...byCategory].map(([category,amountCents])=>({category,amountCents})).sort((a,b)=>b.amountCents-a.amountCents)}
}
