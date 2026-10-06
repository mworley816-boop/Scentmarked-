export type RevenueBreakdownRow={
 revenue_type:string;gross_cents:number;fee_cents:number;status:string;source_name:string|null;
 affiliate_merchant?:string|null;affiliate_placement?:string|null;perfume_id?:string|null
}
export type RevenueBreakdownItem={key:string;netCents:number;transactions:number}

const usable=(x:RevenueBreakdownRow)=>x.revenue_type==='affiliate'&&!['refunded','void'].includes(x.status)
const net=(x:RevenueBreakdownRow)=>Number(x.gross_cents||0)-Number(x.fee_cents||0)

export function rankAffiliateRevenue(rows:RevenueBreakdownRow[],field:'source_name'|'affiliate_merchant'|'affiliate_placement'|'perfume_id',limit=5){
 const totals=new Map<string,{netCents:number;transactions:number}>()
 for(const row of rows.filter(usable)){
  const key=String(row[field]||'').trim()
  if(!key)continue
  const current=totals.get(key)||{netCents:0,transactions:0}
  current.netCents+=net(row);current.transactions+=1;totals.set(key,current)
 }
 return [...totals].map(([key,value])=>({key,...value})).sort((a,b)=>b.netCents-a.netCents||b.transactions-a.transactions||a.key.localeCompare(b.key)).slice(0,Math.max(0,limit))
}
