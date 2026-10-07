export type MonthlyRevenueRow={gross_cents:number;fee_cents:number;status:string;occurred_at:string}
export type GoalHistoryRow={month_start:string;goal_cents:number;currency:string}
export function monthlyRevenueHistory(rows:MonthlyRevenueRow[],goals:GoalHistoryRow[],months=12,now=new Date()){
 const out=[] as {month:string;netCents:number;transactions:number;goalCents:number|null;goalHit:boolean|null;changeRate:number|null}[]
 for(let offset=months-1;offset>=0;offset--){
  const start=new Date(Date.UTC(now.getUTCFullYear(),now.getUTCMonth()-offset,1)),end=new Date(Date.UTC(start.getUTCFullYear(),start.getUTCMonth()+1,1))
  const active=rows.filter(x=>!['refunded','void'].includes(x.status)&&new Date(x.occurred_at)>=start&&new Date(x.occurred_at)<end)
  const netCents=active.reduce((s,x)=>s+Number(x.gross_cents||0)-Number(x.fee_cents||0),0),month=start.toISOString().slice(0,7)
  const goal=goals.find(x=>x.month_start.slice(0,7)===month),prev=out.at(-1)
  out.push({month,netCents,transactions:active.length,goalCents:goal?Number(goal.goal_cents):null,goalHit:goal?netCents>=Number(goal.goal_cents):null,changeRate:prev?(prev.netCents?((netCents-prev.netCents)/prev.netCents):netCents===0?0:null):null})
 }
 return out
}
