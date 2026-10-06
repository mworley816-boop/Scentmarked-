export type MembershipEntitlement='catalog'|'compare'|'community'|'basic_matches'|'advanced_matches'|'taste_insights'|'unlimited_lists'|'deal_alerts'
export type MembershipState={planSlug:string;planName:string;status:string;entitlements:MembershipEntitlement[];currentPeriodEnd:string|null;cancelAtPeriodEnd:boolean}

export const FREE_MEMBERSHIP:MembershipState={planSlug:'free',planName:'Free',status:'active',entitlements:['catalog','compare','community','basic_matches'],currentPeriodEnd:null,cancelAtPeriodEnd:false}
export const hasEntitlement=(membership:MembershipState,entitlement:MembershipEntitlement)=>membership.entitlements.includes(entitlement)
