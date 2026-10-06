export type RevenueTrendRow={gross_cents:number;fee_cents:number;status:string;occurred_at:string}

const usable=(x:RevenueTrendRow)=>!['refunded','void'].includes(x.status)
const net=(x:RevenueTrendRow)=>Number(x.gross_cents||0)-Number(x.fee_cents||0)

export function revenueTrendMetrics(rows:RevenueTrendRow[],now=new Date()){
 const currentStart=new Date(Date.UTC(now.getUTCFullYear(),now.getUTCMonth(),1))
 const nextStart=new Date(Date.UTC(now.getUTCFullYear(),now.getUTCMonth()+1,1))
 const previousStart=new Date(Date.UTC(now.getUTCFullYear(),now.getUTCMonth()-1,1))
 const active=rows.filter(usable)
 const current=active.filter(x=>{const d=new Date(x.occurred_at);return d>=currentStart&&d<nextStart})
 const previous=active.filter(x=>{const d=new Date(x.occurred_at);return d>=previousStart&&d<currentStart})
 const currentNetCents=current.reduce((s,x)=>s+net(x),0),previousNetCents=previous.reduce((s,x)=>s+net(x),0)
 const growthRate=previousNetCents?((currentNetCents-previousNetCents)/previousNetCents):currentNetCents?1:0
 return {
  currentNetCents,previousNetCents,growthRate,
  pendingCents:active.filter(x=>x.status==='pending').reduce((s,x)=>s+net(x),0),
  realizedCents:active.filter(x=>['confirmed','paid'].includes(x.status)).reduce((s,x)=>s+net(x),0),
  currentTransactions:current.length,previousTransactions:previous.length
 }
}
