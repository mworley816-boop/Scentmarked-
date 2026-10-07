export type MonetizationAlert={severity:'critical'|'warning'|'info';code:string;title:string;detail:string}
export type MonetizationHealthInput={
 goal:{goalCents:number;projectedCents:number;onPace:boolean}
 pendingCents:number;realizedCents:number
 reconciliation:{conflict:number;unresolved:number}
 affiliateClicks:number|null;affiliateConversions:number
 streams:{type:string;monthToDateCents:number;projectedCents:number}[]
}
export function monetizationHealthAlerts(x:MonetizationHealthInput):MonetizationAlert[]{
 const alerts:MonetizationAlert[]=[]
 if(x.goal.goalCents>0&&!x.goal.onPace)alerts.push({severity:'critical',code:'below_goal_pace',title:'Revenue is below goal pace',detail:`Projected month-end revenue is ${Math.round(x.goal.projectedCents/x.goal.goalCents*100)}% of the monthly target.`})
 const tracked=x.pendingCents+x.realizedCents
 if(tracked>0&&x.pendingCents/tracked>=.4)alerts.push({severity:'warning',code:'high_pending',title:'A large share of revenue is pending',detail:`${Math.round(x.pendingCents/tracked*100)}% of tracked net revenue is still pending.`})
 if(x.reconciliation.conflict>0)alerts.push({severity:'critical',code:'attribution_conflicts',title:'Affiliate attribution conflicts need review',detail:`${x.reconciliation.conflict} commission${x.reconciliation.conflict===1?'':'s'} conflict with exact tracking data.`})
 if(x.reconciliation.unresolved>0)alerts.push({severity:'warning',code:'unresolved_attribution',title:'Some commissions remain unattributed',detail:`${x.reconciliation.unresolved} commission${x.reconciliation.unresolved===1?'':'s'} lack enough exact tracking data.`})
 if(x.affiliateClicks!==null&&x.affiliateClicks>=20&&x.affiliateConversions/x.affiliateClicks<.01)alerts.push({severity:'warning',code:'low_affiliate_conversion',title:'Affiliate conversion is low',detail:`Tracked conversion is ${(x.affiliateConversions/x.affiliateClicks*100).toFixed(1)}% across ${x.affiliateClicks} clicks.`})
 for(const s of x.streams)if(s.monthToDateCents===0)alerts.push({severity:'info',code:`inactive_${s.type}`,title:`No ${s.type} revenue this month`,detail:`The ${s.type} stream has not contributed net revenue yet this month.`})
 return alerts
}
