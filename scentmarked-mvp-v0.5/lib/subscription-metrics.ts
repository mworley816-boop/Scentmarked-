export type SubscriptionMetricRow={status:string;provider?:string|null;current_period_end?:string|null;cancel_at_period_end?:boolean}
export function subscriptionMetrics(rows:SubscriptionMetricRow[],now=Date.now()){
 const usable=rows.filter(x=>['trialing','active'].includes(x.status)&&(!x.current_period_end||new Date(x.current_period_end).getTime()>now))
 return {
  active:usable.length,
  trialing:usable.filter(x=>x.status==='trialing').length,
  manual:usable.filter(x=>x.provider==='manual').length,
  cancelAtPeriodEnd:usable.filter(x=>x.cancel_at_period_end).length,
  pastDue:rows.filter(x=>x.status==='past_due').length
 }
}
