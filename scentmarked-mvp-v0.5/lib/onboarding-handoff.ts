export const onboardingCookie='scentmarked_onboarding'

const allowedLoved=['Gourmand','Fruity','Floral','Fresh','Citrus','Woody','Amber','Spicy','Musky','Aquatic','Green','Smoky','Vanilla','Marshmallow','Caramel','Strawberry','Cherry','Peach','Mango','Pear','Coconut','Chocolate','Coffee','Praline','Rose','Jasmine','Orange Blossom','Bergamot','Lemon','Sandalwood','Oud','Musk','Patchouli']
const allowedAvoided=['Vanilla','Marshmallow','Caramel','Strawberry','Cherry','Peach','Mango','Pear','Coconut','Chocolate','Coffee','Praline','Rose','Jasmine','Orange Blossom','Bergamot','Lemon','Sandalwood','Oud','Musk','Amber','Patchouli']
const allowedOccasions=['Everyday','Work or School','Date Night','Going Out','Special Occasions','Cozy at Home','Vacation or Summer','Cold Weather']
const allowedVibes=['Cozy & Comforting','Sexy & Seductive','Clean & Polished','Playful & Sweet','Elegant & Sophisticated','Bold & Mysterious','Fresh & Energetic','Dark & Luxurious']
const allowedPresentations=['Feminine-leaning','Masculine-leaning','Unisex / Gender-neutral','No preference']
const allowedBudgets=new Set([30,60,100,150,250])

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
  const clean=(value:unknown,max=80)=>typeof value==='string'?value.trim().replace(/\s+/g,' ').slice(0,max):''
  const list=(key:string)=>{const seen=new Set<string>();return Array.isArray(parsed[key])?parsed[key].map((x:unknown)=>clean(x)).filter((x:string)=>{const k=x.toLocaleLowerCase();if(!x||seen.has(k))return false;seen.add(k);return true}).slice(0,30):[]}
  const allowedList=(key:string,allowed:string[])=>{const byKey=new Map(allowed.map(x=>[x.toLocaleLowerCase(),x]));return list(key).map(x=>byKey.get(x.toLocaleLowerCase())).filter((x):x is string=>!!x)}
  const score=(key:string)=>{const n=Number(parsed[key]);return Number.isInteger(n)&&n>=1&&n<=5?n:null}
  const rawBudget=Number(parsed.budget),favoriteIds=list('favoriteIds').filter((x:string)=>/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(x)).slice(0,8)
  const presentations=allowedList('presentations',allowedPresentations)
  return {loved:allowedList('loved',allowedLoved),avoided:allowedList('avoided',allowedAvoided),occasions:allowedList('occasions',allowedOccasions),vibes:allowedList('vibes',allowedVibes),presentations:presentations.includes('No preference')?['No preference']:presentations,favoriteIds,sweetness:score('sweetness'),projection:score('projection'),longevity:score('longevity'),budget:Number.isSafeInteger(rawBudget)&&allowedBudgets.has(rawBudget)?rawBudget:null,marketingConsent:parsed.marketingConsent===true}
 }catch{return null}
}


export function parseOnboardingHandoff(value:unknown):OnboardingHandoff|null{
 try{return decodeOnboardingHandoff(Buffer.from(JSON.stringify(value),'utf8').toString('base64url'))}catch{return null}
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
  const {data:crm,error:crmError}=await supabase.from('crm_contacts').update({
   marketing_consent:true,marketing_consented_at:now,status:'active',unsubscribed_at:null,updated_at:now
  }).eq('user_id',userId).not('status','in','("bounced","suppressed")').select('id').maybeSingle()
  if(crmError||!crm)console.error('Onboarding CRM consent sync did not update a contact',crmError?.message||'contact unavailable')
 }
 return true
}
