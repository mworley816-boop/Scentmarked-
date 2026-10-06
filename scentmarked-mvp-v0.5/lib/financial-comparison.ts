import { pnlSummary,type PnlRevenueRow,type PnlExpenseRow } from './pnl-summary.ts'
export type ComparisonKind='month'|'quarter'|'ytd'
function iso(d:Date){return d.toISOString().slice(0,10)}
export function comparisonRanges(kind:ComparisonKind,now=new Date()){
 const y=now.getUTCFullYear(),m=now.getUTCMonth(),today=iso(now)
 if(kind==='month'){const currentFrom=iso(new Date(Date.UTC(y,m,1))),prevStart=new Date(Date.UTC(y,m-1,1)),prevEnd=new Date(Date.UTC(y,m,0));return {current:{from:currentFrom,to:today},previous:{from:iso(prevStart),to:iso(prevEnd)}}}
 if(kind==='quarter'){const q=Math.floor(m/3)*3,currentFrom=new Date(Date.UTC(y,q,1)),prevFrom=new Date(Date.UTC(y,q-3,1)),prevTo=new Date(Date.UTC(y,q,0));return {current:{from:iso(currentFrom),to:today},previous:{from:iso(prevFrom),to:iso(prevTo)}}}
 const currentFrom=iso(new Date(Date.UTC(y,0,1))),previousFrom=iso(new Date(Date.UTC(y-1,0,1))),previousTo=iso(new Date(Date.UTC(y-1,m,now.getUTCDate())))
 return {current:{from:currentFrom,to:today},previous:{from:previousFrom,to:previousTo}}
}
function change(current:number,previous:number){return previous?(current-previous)/Math.abs(previous):current?1:0}
export function financialComparison(revenue:PnlRevenueRow[],expenses:PnlExpenseRow[],kind:ComparisonKind,now=new Date()){
 const ranges=comparisonRanges(kind,now),current=pnlSummary(revenue,expenses,ranges.current.from,ranges.current.to),previous=pnlSummary(revenue,expenses,ranges.previous.from,ranges.previous.to)
 return {kind,ranges,current,previous,changes:{netRevenue:change(current.netRevenueCents,previous.netRevenueCents),expenses:change(current.expenseCents,previous.expenseCents),profit:change(current.profitCents,previous.profitCents),margin:current.profitMargin-previous.profitMargin}}
}
