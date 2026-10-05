import Link from 'next/link'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import FavoritePerfumeChecks from '@/components/favorite-perfume-checks'
import PresentationChecks from '@/components/presentation-checks'
import NotePreferenceChecks from '@/components/note-preference-checks'
import ScentProfileForm from '@/components/scent-profile-form'
import ScentProfileSubmit from '@/components/scent-profile-submit'
import { hasScentProfileRankingSignal } from '@/lib/scent-profile'
import { encodeOnboardingHandoff,onboardingCookie } from '@/lib/onboarding-handoff'

export const metadata={title:'Build Your Scent Profile',robots:{index:false,follow:false}}

const families=['Gourmand','Fruity','Floral','Fresh','Citrus','Woody','Amber','Spicy','Musky','Aquatic','Green','Smoky']
const presentations=['Feminine-leaning','Masculine-leaning','Unisex / Gender-neutral','No preference']
const occasions=['Everyday','Work or School','Date Night','Going Out','Special Occasions','Cozy at Home','Vacation or Summer','Cold Weather']
const vibes=['Cozy & Comforting','Sexy & Seductive','Clean & Polished','Playful & Sweet','Elegant & Sophisticated','Bold & Mysterious','Fresh & Energetic','Dark & Luxurious']
const notes=['Vanilla','Marshmallow','Caramel','Strawberry','Cherry','Peach','Mango','Pear','Coconut','Chocolate','Coffee','Praline','Rose','Jasmine','Orange Blossom','Bergamot','Lemon','Sandalwood','Oud','Musk','Amber','Patchouli']
const traitOptions={
 sweetness:[['1','Not sweet'],['2','Lightly sweet'],['3','Balanced'],['4','Sweet'],['5','Very sweet']],
 projection:[['1','Close to skin'],['2','Soft'],['3','Moderate'],['4','Noticeable'],['5','Room-filling']],
 longevity:[['1','A few hours'],['2','Short wear'],['3','4–6 hours'],['4','6–8 hours'],['5','8+ hours']]
}
const budgets=[['0','No preference'],['30','Under $30'],['60','$30–$60'],['100','$60–$100'],['150','$100–$150'],['250','$150+']]

function checked(formData:FormData,name:string,allowed:string[]){
 const allow=new Set(allowed.map(x=>x.toLocaleLowerCase()))
 const seen=new Set<string>()
 return formData.getAll(name).map(String).map(x=>x.trim()).filter(x=>{
  const key=x.toLocaleLowerCase()
  if(!allow.has(key)||seen.has(key))return false
  seen.add(key);return true
 }).slice(0,30)
}
function trait(formData:FormData,name:string){
 const n=Number(formData.get(name)||0)
 return Number.isInteger(n)&&n>=1&&n<=5?n:null
}

async function saveProfile(formData:FormData){
 'use server'
 const s=await createClient()
 const {data:{user}}=await s.auth.getUser()
 const loved=[...checked(formData,'families',families),...checked(formData,'lovedNotes',notes)]
 const avoided=checked(formData,'avoidedNotes',notes)
 const selectedOccasions=checked(formData,'occasions',occasions)
 const rawPresentations=checked(formData,'presentations',presentations)
 const selectedPresentations=rawPresentations.includes('No preference')?['No preference']:rawPresentations
 const selectedVibes=checked(formData,'vibes',vibes)
 const submittedFavoriteIds=[...new Set(formData.getAll('favoritePerfumes').map(String).filter(x=>/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(x)))].slice(0,8)
 let favoriteIds:string[]=[]
 if(submittedFavoriteIds.length){
  const {data:publishedFavorites,error:favoriteError}=await s.from('perfumes').select('id').eq('status','published').in('id',submittedFavoriteIds)
  if(favoriteError)redirect('/onboarding?error=save-failed')
  const publishedSet=new Set((publishedFavorites||[]).map((row:any)=>String(row.id)))
  favoriteIds=submittedFavoriteIds.filter(id=>publishedSet.has(id))
 }
 const avoidedKeys=new Set(avoided.map(x=>x.toLocaleLowerCase()))
 const resolvedLoved=loved.filter(x=>!avoidedKeys.has(x.toLocaleLowerCase()))
 const rawBudget=String(formData.get('budget')||'0')
 const budget=/^\d+$/.test(rawBudget)?Number(rawBudget):0
 const sweetness=trait(formData,'sweetness'),projection=trait(formData,'projection'),longevity=trait(formData,'longevity')
 const marketingConsent=formData.get('marketingConsent')==='yes'
 const hasRankingSignal=hasScentProfileRankingSignal({loved:resolvedLoved,avoided,favoriteIds,presentations:selectedPresentations,sweetness,projection,longevity,budget})
 if(!hasRankingSignal)redirect('/onboarding?error=choose-preference')
 if(!user){const jar=await cookies();jar.set(onboardingCookie,encodeOnboardingHandoff({loved:resolvedLoved,avoided,occasions:selectedOccasions,vibes:selectedVibes,presentations:selectedPresentations,favoriteIds,sweetness,projection,longevity,budget:Number.isSafeInteger(budget)&&budget>0?budget:null,marketingConsent}),{httpOnly:true,sameSite:'lax',secure:process.env.NODE_ENV==='production',path:'/',maxAge:86400});redirect('/login?signup=finish&next='+encodeURIComponent('/matches?profile=ready'))}
 let failed=false
 try{
  const {data,error}=await s.from('profiles').update({
   scent_loved_notes:resolvedLoved,
   scent_avoided_notes:avoided,
   scent_sweetness:sweetness,
   scent_projection:projection,
   scent_longevity:longevity,
   scent_max_price:Number.isSafeInteger(budget)&&budget>0?budget:null,
   scent_occasions:selectedOccasions,
   scent_vibes:selectedVibes,
   scent_presentations:selectedPresentations,
   scent_profile_completed_at:new Date().toISOString(),
   scent_favorite_perfume_ids:favoriteIds
  }).eq('id',user.id).select('id').maybeSingle()
  failed=!!error||!data
 }catch{failed=true}
 if(failed)redirect('/onboarding?error=save-failed')
 const revision={user_id:user.id,loved_notes:resolvedLoved,avoided_notes:avoided,presentations:selectedPresentations,favorite_perfume_ids:favoriteIds,sweetness,projection,longevity,max_price:Number.isSafeInteger(budget)&&budget>0?budget:null}
 const {data:lastRevision,error:revisionLookupError}=await s.from('taste_profile_revisions').select('loved_notes,avoided_notes,presentations,favorite_perfume_ids,sweetness,projection,longevity,max_price').eq('user_id',user.id).order('created_at',{ascending:false}).limit(1).maybeSingle()
 const sameList=(a:string[]|null|undefined,b:string[]|null|undefined)=>JSON.stringify([...(a||[])].sort())===JSON.stringify([...(b||[])].sort())
 const unchanged=!!lastRevision&&sameList(lastRevision.loved_notes,revision.loved_notes)&&sameList(lastRevision.avoided_notes,revision.avoided_notes)&&sameList(lastRevision.presentations,revision.presentations)&&sameList(lastRevision.favorite_perfume_ids,revision.favorite_perfume_ids)&&lastRevision.sweetness===revision.sweetness&&lastRevision.projection===revision.projection&&lastRevision.longevity===revision.longevity&&Number(lastRevision.max_price??0)===Number(revision.max_price??0)
 if(revisionLookupError)console.error('Taste revision lookup failed',revisionLookupError.message)
 else if(!unchanged){const {error:revisionError}=await s.from('taste_profile_revisions').insert(revision);if(revisionError)console.error('Taste revision snapshot failed',revisionError.message)}
 try{
  const now=new Date().toISOString()
  if(marketingConsent){
   await s.from('crm_contacts').update({marketing_consent:true,marketing_consented_at:now,status:'active',unsubscribed_at:null,updated_at:now}).eq('user_id',user.id).not('status','in','("bounced","suppressed")')
  }
 }catch{}
 redirect('/matches?profile=ready')
}

function Checks({name,items,selected=[]}:{name:string,items:string[],selected?:string[]}){
 const chosen=new Set(selected.map(x=>x.toLocaleLowerCase()))
 return <div className="quiz-check-grid">{items.map(item=><label className="quiz-check" key={item}><input type="checkbox" name={name} value={item} defaultChecked={chosen.has(item.toLocaleLowerCase())}/><span>{item}</span></label>)}</div>
}
function Radios({name,items,selected}:{name:string,items:string[][],selected?:string|number|null}){
 return <div className="quiz-check-grid quiz-radio-grid">{items.map(([value,label])=><label className="quiz-check" key={value}><input type="radio" name={name} value={value} defaultChecked={String(selected??'')===value}/><span>{label}</span></label>)}</div>
}

export default async function Onboarding({searchParams}:{searchParams:Promise<{error?:string}>}){
 const p=await searchParams
 const s=await createClient()
 const {data:{user}}=await s.auth.getUser()
 type ScentProfile={scent_loved_notes:string[]|null;scent_avoided_notes:string[]|null;scent_sweetness:number|null;scent_projection:number|null;scent_longevity:number|null;scent_max_price:number|null;scent_occasions:string[]|null;scent_vibes:string[]|null;scent_presentations:string[]|null;scent_profile_completed_at:string|null;scent_favorite_perfume_ids:string[]|null}
 let saved:ScentProfile|null=null,loadError=false
 if(user)try{const {data,error}=await s.from('profiles').select('scent_loved_notes,scent_avoided_notes,scent_sweetness,scent_projection,scent_longevity,scent_max_price,scent_occasions,scent_vibes,scent_presentations,scent_profile_completed_at,scent_favorite_perfume_ids').eq('id',user.id).maybeSingle();if(error)loadError=true;else saved=data as ScentProfile|null}catch{loadError=true}
 const savedFavoriteIds=saved?.scent_favorite_perfume_ids||[]
 const [{data:catalogFavorites},{data:savedFavoriteRows}]=await Promise.all([
  s.from('perfumes').select('id,name,brands(name)').eq('status','published').order('name'),
  savedFavoriteIds.length?s.from('perfumes').select('id,name,brands(name)').eq('status','published').in('id',savedFavoriteIds):Promise.resolve({data:[] as any[]})
 ])
 const savedFavoriteMap=new Map<string,any>()
 for(const perfume of savedFavoriteRows||[])savedFavoriteMap.set(String(perfume.id),perfume)
 const freshFavoriteMap=new Map<string,any>()
 const brandBuckets=new Map<string,any[]>()
 for(const perfume of catalogFavorites||[]){
  if(savedFavoriteMap.has(String(perfume.id)))continue
  const brand=String((perfume as any).brands?.name||'Other')
  const bucket=brandBuckets.get(brand)||[]
  bucket.push(perfume);brandBuckets.set(brand,bucket)
 }
 const buckets=[...brandBuckets.entries()]
  .sort(([a],[b])=>a.localeCompare(b))
  .map(([,bucket])=>bucket.sort((a,b)=>String(a.name).localeCompare(String(b.name))))
 let round=0
 while(freshFavoriteMap.size<24&&buckets.some(bucket=>round<bucket.length)){
  for(const bucket of buckets){
   const perfume=bucket[round]
   if(perfume&&!freshFavoriteMap.has(String(perfume.id)))freshFavoriteMap.set(String(perfume.id),perfume)
   if(freshFavoriteMap.size>=24)break
  }
  round+=1
 }
 const favoriteOptions=[...savedFavoriteMap.values(),...freshFavoriteMap.values()]
 const loved=saved?.scent_loved_notes||[],familyKeys=new Set(families.map(x=>x.toLocaleLowerCase())),savedFamilies=loved.filter(x=>familyKeys.has(x.toLocaleLowerCase())),savedNotes=loved.filter(x=>!familyKeys.has(x.toLocaleLowerCase())),completed=!!saved?.scent_profile_completed_at
 return <main className="quiz-page"><section className="quiz-shell">
  <p className="eyebrow">YOUR SCENTMARKED PROFILE</p>
  <h1>{completed?'Edit your scent profile':'What smells like you?'}</h1>
  <p className="quiz-intro">{completed?'Update any answers that have changed. Your saved recommendation signals will continue shaping your ScentMarked matches.':'Check the answers that fit you best. You can leave individual questions unanswered, but saving a completed Scent Profile requires at least one preference that can affect recommendations. “No preference” answers do not count as ranking signals. You can change these preferences later.'}</p>
  {loadError&&<div className="notice error" role="alert">Your saved scent profile could not be loaded. You can still choose new preferences, but saving will replace your previous questionnaire answers.</div>}
  {p.error==='save-failed'&&<div className="notice error" role="alert">Your scent profile could not be saved. Please try again.</div>}{p.error==='choose-preference'&&<div className="notice error" role="alert">Choose at least one recommendation preference before saving. You can still leave any individual question unanswered, or use “Skip for now” instead.</div>}
  <ScentProfileForm action={saveProfile}>
   <fieldset><legend>1. Which scent families are you drawn to?</legend><p>Choose as many as you like.</p><Checks name="families" items={families} selected={savedFamilies}/></fieldset>
   <NotePreferenceChecks items={notes} loved={savedNotes} avoided={saved?.scent_avoided_notes||[]}/>
   <fieldset><legend>4. What fragrance presentation do you enjoy?</legend><p>Choose one or more. Selecting “No preference” clears the other choices. Fragrance has no rules—this only helps tune your matches.</p><PresentationChecks items={presentations} selected={saved?.scent_presentations||[]}/></fieldset>
   <fieldset><legend>5. When do you usually wear fragrance?</legend><p>Check every occasion that fits.</p><Checks name="occasions" items={occasions} selected={saved?.scent_occasions||[]}/></fieldset>
   <fieldset><legend>6. What fragrance vibes feel most like you?</legend><p>Choose all that sound good to you.</p><Checks name="vibes" items={vibes} selected={saved?.scent_vibes||[]}/></fieldset>
   <fieldset><legend>7. Which fragrances do you already love?</legend><p>Check up to 8. This helps ScentMarked learn your taste from real fragrances. Leave this blank if none of these are favorites yet.</p><FavoritePerfumeChecks items={(favoriteOptions||[]).map((perfume:any)=>({id:perfume.id,name:perfume.name,brand:perfume.brands?.name||null}))} selected={saved?.scent_favorite_perfume_ids||[]}/></fieldset>
   <fieldset><legend>8. How sweet do you like your fragrances?</legend><Radios name="sweetness" items={traitOptions.sweetness} selected={saved?.scent_sweetness}/></fieldset>
   <fieldset><legend>9. How much projection do you like?</legend><Radios name="projection" items={traitOptions.projection} selected={saved?.scent_projection}/></fieldset>
   <fieldset><legend>10. How long should your fragrance last?</legend><Radios name="longevity" items={traitOptions.longevity} selected={saved?.scent_longevity}/></fieldset>
   <fieldset><legend>11. What do you usually want to spend?</legend><Radios name="budget" items={budgets} selected={saved?.scent_max_price}/></fieldset>
   <fieldset><legend>Stay in the scent loop?</legend><p>Optional. Get ScentMarked perfume finds, match updates and occasional news by email. You can unsubscribe anytime.</p><label className="quiz-check"><input type="checkbox" name="marketingConsent" value="yes"/><span>Yes, send me ScentMarked marketing emails.</span></label></fieldset>
   <div className="quiz-actions"><ScentProfileSubmit completed={completed}/>{user?<Link href="/matches">{completed?'Cancel':'Skip for now'}</Link>:<Link href="/login">Already have an account? Sign in</Link>}</div>
  </ScentProfileForm>
 </section></main>
}
