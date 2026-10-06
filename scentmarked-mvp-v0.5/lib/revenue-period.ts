export type RevenuePeriod='7d'|'30d'|'90d'|'all'

export function normalizeRevenuePeriod(value?:string|null):RevenuePeriod{
 return value==='7d'||value==='30d'||value==='90d'||value==='all'?value:'30d'
}
export function revenuePeriodStart(period:RevenuePeriod,now=new Date()){
 if(period==='all')return null
 const days=period==='7d'?7:period==='90d'?90:30
 return new Date(now.getTime()-days*86400000)
}
export function filterRevenuePeriod<T extends {occurred_at:string}>(rows:T[],period:RevenuePeriod,now=new Date()){
 const start=revenuePeriodStart(period,now)
 return start?rows.filter(x=>{const d=new Date(x.occurred_at);return !Number.isNaN(d.getTime())&&d>=start&&d<=now}):rows
}
