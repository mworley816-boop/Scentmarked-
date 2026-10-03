import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

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
 if(!user)redirect('/login?next='+encodeURIComponent('/onboarding'))
 const loved=[...checked(formData,'families',families),...checked(formData,'lovedNotes',notes)]
 const avoided=checked(formData,'avoidedNotes',notes)
 const selectedOccasions=checked(formData,'occasions',occasions)
 const selectedPresentations=checked(formData,'presentations',presentations)
 const selectedVibes=checked(formData,'vibes',vibes)
 const avoidedKeys=new Set(avoided.map(x=>x.toLocaleLowerCase()))
 const resolvedLoved=loved.filter(x=>!avoidedKeys.has(x.toLocaleLowerCase()))
 const rawBudget=String(formData.get('budget')||'0')
 const budget=/^\d+$/.test(rawBudget)?Number(rawBudget):0
 let failed=false
 try{
  const {data,error}=await s.from('profiles').update({
   scent_loved_notes:resolvedLoved,
   scent_avoided_notes:avoided,
   scent_sweetness:trait(formData,'sweetness'),
   scent_projection:trait(formData,'projection'),
   scent_longevity:trait(formData,'longevity'),
   scent_max_price:Number.isSafeInteger(budget)&&budget>0?budget:null,
   scent_occasions:selectedOccasions,
   scent_vibes:selectedVibes,
   scent_presentations:selectedPresentations,
   scent_profile_completed_at:new Date().toISOString()
  }).eq('id',user.id).select('id').maybeSingle()
  failed=!!error||!data
 }catch{failed=true}
 if(failed)redirect('/onboarding?error=save-failed')
 redirect('/matches')
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
 if(!user)redirect('/login?next='+encodeURIComponent('/onboarding'))
 type ScentProfile={scent_loved_notes:string[]|null;scent_avoided_notes:string[]|null;scent_sweetness:number|null;scent_projection:number|null;scent_longevity:number|null;scent_max_price:number|null;scent_occasions:string[]|null;scent_vibes:string[]|null;scent_presentations:string[]|null;scent_profile_completed_at:string|null}
 let saved:ScentProfile|null=null,loadError=false
 try{const {data,error}=await s.from('profiles').select('scent_loved_notes,scent_avoided_notes,scent_sweetness,scent_projection,scent_longevity,scent_max_price,scent_occasions,scent_vibes,scent_presentations,scent_profile_completed_at').eq('id',user.id).maybeSingle();if(error)loadError=true;else saved=data as ScentProfile|null}catch{loadError=true}
 const loved=saved?.scent_loved_notes||[],familyKeys=new Set(families.map(x=>x.toLocaleLowerCase())),savedFamilies=loved.filter(x=>familyKeys.has(x.toLocaleLowerCase())),savedNotes=loved.filter(x=>!familyKeys.has(x.toLocaleLowerCase())),completed=!!saved?.scent_profile_completed_at
 return <main className="quiz-page"><section className="quiz-shell">
  <p className="eyebrow">YOUR SCENTMARKED PROFILE</p>
  <h1>{completed?'Edit your scent profile':'What smells like you?'}</h1>
  <p className="quiz-intro">{completed?'Update any answers that have changed. Your saved preferences will continue shaping your ScentMarked matches.':'Check the answers that fit you best. We’ll use them to personalize your first scent matches. You can change these preferences later.'}</p>
  {loadError&&<div className="notice error" role="alert">Your saved scent profile could not be loaded. You can still choose new preferences, but saving will replace your previous questionnaire answers.</div>}
  {p.error==='save-failed'&&<div className="notice error" role="alert">Your scent profile could not be saved. Please try again.</div>}
  <form action={saveProfile} className="quiz-form">
   <fieldset><legend>1. Which scent families are you drawn to?</legend><p>Choose as many as you like.</p><Checks name="families" items={families} selected={savedFamilies}/></fieldset>
   <fieldset><legend>2. Which notes do you love?</legend><Checks name="lovedNotes" items={notes} selected={savedNotes}/></fieldset>
   <fieldset><legend>3. Which notes do you usually avoid?</legend><p>Leave everything unchecked if you’re not sure yet.</p><Checks name="avoidedNotes" items={notes} selected={saved?.scent_avoided_notes||[]}/></fieldset>
   <fieldset><legend>4. What fragrance presentation do you enjoy?</legend><p>Choose one or more. Fragrance has no rules—this only helps tune your matches.</p><Checks name="presentations" items={presentations} selected={saved?.scent_presentations||[]}/></fieldset>
   <fieldset><legend>5. When do you usually wear fragrance?</legend><p>Check every occasion that fits.</p><Checks name="occasions" items={occasions} selected={saved?.scent_occasions||[]}/></fieldset>
   <fieldset><legend>6. What fragrance vibes feel most like you?</legend><p>Choose all that sound good to you.</p><Checks name="vibes" items={vibes} selected={saved?.scent_vibes||[]}/></fieldset>
   <fieldset><legend>7. How sweet do you like your fragrances?</legend><Radios name="sweetness" items={traitOptions.sweetness} selected={saved?.scent_sweetness}/></fieldset>
   <fieldset><legend>8. How much projection do you like?</legend><Radios name="projection" items={traitOptions.projection} selected={saved?.scent_projection}/></fieldset>
   <fieldset><legend>9. How long should your fragrance last?</legend><Radios name="longevity" items={traitOptions.longevity} selected={saved?.scent_longevity}/></fieldset>
   <fieldset><legend>10. What do you usually want to spend?</legend><Radios name="budget" items={budgets} selected={saved?.scent_max_price}/></fieldset>
   <div className="quiz-actions"><button type="submit">{completed?'Update & Find My Matches':'Save & Find My Matches'}</button><a href="/matches">{completed?'Cancel':'Skip for now'}</a></div>
  </form>
 </section></main>
}
