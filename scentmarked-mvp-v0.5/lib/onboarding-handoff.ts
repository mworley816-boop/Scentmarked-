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
