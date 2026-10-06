export type RevenueStream='affiliate'|'sponsorship'|'advertising'|'subscription'
export type RevenueStreamRow={revenue_type:string;gross_cents:number;fee_cents:number;status:string;occurred_at:string}
export type RevenueStreamForecast={type:RevenueStream;monthToDateCents:number;projectedCents:number;share:number;transactions:number}

const streams:RevenueStream[]=['affiliate','sponsorship','advertising','subscription']
export function revenueStreamForecast(rows:RevenueStreamRow[],now=new Date()):RevenueStreamForecast[]{
 const start=new Date(Date.UTC(now.getUTCFullYear(),now.getUTCMonth(),1)),end=new Date(Date.UTC(now.getUTCFullYear(),now.getUTCMonth()+1,1))
 const daysInMonth=new Date(Date.UTC(now.getUTCFullYear(),now.getUTCMonth()+1,0)).getUTCDate(),elapsed=Math.max(1,now.getUTCDate())
 const active=rows.filter(x=>!['refunded','void'].includes(x.status)&&new Date(x.occurred_at)>=start&&new Date(x.occurred_at)<end)
 const totals=new Map<RevenueStream,{net:number;transactions:number}>()
 for(const type of streams)totals.set(type,{net:0,transactions:0})
 for(const row of active){if(!streams.includes(row.revenue_type as RevenueStream))continue;const x=totals.get(row.revenue_type as RevenueStream)!;x.net+=Number(row.gross_cents||0)-Number(row.fee_cents||0);x.transactions++}
 const total=[...totals.values()].reduce((s,x)=>s+x.net,0)
 return streams.map(type=>{const x=totals.get(type)!;return {type,monthToDateCents:x.net,projectedCents:Math.round(x.net/elapsed*daysInMonth),share:total?x.net/total:0,transactions:x.transactions}})
}
