import { createServiceClient } from '@/lib/supabase/service'

export type MembershipEntitlement='catalog'|'compare'|'community'|'basic_matches'|'advanced_matches'|'taste_insights'|'unlimited_lists'|'deal_alerts'
export type MembershipState={planSlug:string;planName:string;status:string;entitlements:MembershipEntitlement[];currentPeriodEnd:string|null;cancelAtPeriodEnd:boolean}

const FREE:MembershipState={planSlug:'free',planName:'Free',status:'active',entitlements:['catalog','compare','community','basic_matches'],currentPeriodEnd:null,cancelAtPeriodEnd:false}

export async function getMembership(userId:string|null|undefined):Promise<MembershipState>{
 if(!userId)return FREE
 try{
  const service=createServiceClient()
  const {data}=await service.from('member_subscriptions').select('status,current_period_end,cancel_at_period_end,membership_plans(slug,name,entitlements)').eq('user_id',userId).in('status',['trialing','active','past_due','cancelled']).order('updated_at',{ascending:false}).limit(1).maybeSingle()
  const plan=(data as any)?.membership_plans
  const end=(data as any)?.current_period_end as string|null
  const usable=!!data&&['trialing','active'].includes((data as any).status)&&(!end||new Date(end).getTime()>Date.now())
  if(!usable||!plan)return FREE
  return {planSlug:String(plan.slug||'free'),planName:String(plan.name||'Free'),status:String((data as any).status),entitlements:Array.isArray(plan.entitlements)?plan.entitlements:[],currentPeriodEnd:end||null,cancelAtPeriodEnd:Boolean((data as any).cancel_at_period_end)}
 }catch{return FREE}
}

export const hasEntitlement=(membership:MembershipState,entitlement:MembershipEntitlement)=>membership.entitlements.includes(entitlement)
