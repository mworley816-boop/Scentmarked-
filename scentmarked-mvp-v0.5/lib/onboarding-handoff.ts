export const onboardingCookie='scentmarked_onboarding'

export type OnboardingHandoff={
 loved:string[]
 avoided:string[]
 occasions:string[]
 vibes:string[]
 presentations:string[]
 favoriteIds:string[]
 sweetness:number|null
 projection:number|null
 longevity:number|null
 budget:number|null
 marketingConsent:boolean
}

export function encodeOnboardingHandoff(value:OnboardingHandoff){
 return Buffer.from(JSON.stringify(value),'utf8').toString('base64url')
}

export function decodeOnboardingHandoff(value?:string|null):OnboardingHandoff|null{
 if(!value)return null
 try{
  const parsed=JSON.parse(Buffer.from(value,'base64url').toString('utf8'))
  if(!parsed||typeof parsed!=='object')return null
  const list=(key:string)=>Array.isArray(parsed[key])?parsed[key].map(String).slice(0,30):[]
  const score=(key:string)=>{const n=Number(parsed[key]);return Number.isInteger(n)&&n>=1&&n<=5?n:null}
  const rawBudget=Number(parsed.budget)
  return {loved:list('loved'),avoided:list('avoided'),occasions:list('occasions'),vibes:list('vibes'),presentations:list('presentations'),favoriteIds:list('favoriteIds').slice(0,8),sweetness:score('sweetness'),projection:score('projection'),longevity:score('longevity'),budget:Number.isSafeInteger(rawBudget)&&rawBudget>0?rawBudget:null,marketingConsent:parsed.marketingConsent===true}
 }catch{return null}
}


export async function applyOnboardingHandoff(supabase:any,userId:string,value:OnboardingHandoff){
 const now=new Date().toISOString()
 const {data,error}=await supabase.from('profiles').update({
  scent_loved_notes:value.loved,scent_avoided_notes:value.avoided,scent_sweetness:value.sweetness,
  scent_projection:value.projection,scent_longevity:value.longevity,scent_max_price:value.budget,
  scent_occasions:value.occasions,scent_vibes:value.vibes,scent_presentations:value.presentations,
  scent_favorite_perfume_ids:value.favoriteIds,scent_profile_completed_at:now
 }).eq('id',userId).select('id').maybeSingle()
 if(error||!data)return false
 const {error:revisionError}=await supabase.from('taste_profile_revisions').insert({
  user_id:userId,loved_notes:value.loved,avoided_notes:value.avoided,presentations:value.presentations,
  favorite_perfume_ids:value.favoriteIds,sweetness:value.sweetness,projection:value.projection,
  longevity:value.longevity,max_price:value.budget
 })
 if(revisionError)console.error('Onboarding taste revision snapshot failed',revisionError.message)
 if(value.marketingConsent){
  const {error:crmError}=await supabase.from('crm_contacts').update({
   marketing_consent:true,marketing_consented_at:now,status:'active',unsubscribed_at:null,updated_at:now
  }).eq('user_id',userId).not('status','in','("bounced","suppressed")')
  if(crmError)console.error('Onboarding CRM consent sync failed',crmError.message)
 }
 return true
}
