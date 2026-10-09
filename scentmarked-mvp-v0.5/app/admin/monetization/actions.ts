'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { parseAffiliateCommissionCsv, affiliateImportQuality } from '@/lib/affiliate-import'
import { enrichAffiliateRows } from '@/lib/affiliate-enrichment'
import { reconcileAffiliateRow } from '@/lib/affiliate-reconciliation'

const clean=(v:FormDataEntryValue|null,max=200)=>String(v||'').trim().slice(0,max)
const parseCents=(v:FormDataEntryValue|null,allowZero=false)=>{const raw=typeof v==='string'?v.trim():'';if(!/^\d+(?:\.\d{1,2})?$/.test(raw))return NaN;const [whole,fraction='']=raw.split('.');const amount=Number(whole)*100+Number(fraction.padEnd(2,'0'));return Number.isSafeInteger(amount)&&(allowZero||amount>0)?amount:NaN}
const cents=(v:FormDataEntryValue|null)=>parseCents(v)
const nonnegativeCents=(v:FormDataEntryValue|null)=>parseCents(v,true)
const validCalendarDate=(value:string)=>{const match=/^(\d{4})-(\d{2})-(\d{2})$/.exec(value);if(!match)return false;const year=Number(match[1]),month=Number(match[2]),day=Number(match[3]);if(year<1||month<1||month>12||day<1)return false;const leap=year%4===0&&(year%100!==0||year%400===0);const days=[31,leap?29:28,31,30,31,30,31,31,30,31,30,31];return day<=days[month-1]}
const validExpenseDate=(value:string)=>validCalendarDate(value)

async function requireAdmin(){
 const s=await createClient()
 const {data:{user}}=await s.auth.getUser()
 if(!user)redirect('/login?next=/admin/monetization')
 const {data:profile}=await s.from('profiles').select('is_admin').eq('id',user.id).maybeSingle()
 if(profile?.is_admin!==true)redirect('/discover')
 return createServiceClient()
}

export async function recordRevenue(formData:FormData){
 const service=await requireAdmin()
 const revenue_type=clean(formData.get('revenue_type'),30)
 const source_name=clean(formData.get('source_name'),120)
 const status=clean(formData.get('status'),30)||'pending'
 if(!['affiliate','sponsorship','advertising','subscription','other'].includes(revenue_type)||!source_name||!['pending','confirmed','paid','refunded','void'].includes(status))redirect('/admin/monetization?error=Invalid+revenue+entry')
 const payload={revenue_type,source_name,external_id:clean(formData.get('external_id'),160)||null,gross_cents:cents(formData.get('gross')),fee_cents:String(formData.get('fees')||'').trim()===''?0:nonnegativeCents(formData.get('fees')),currency:(clean(formData.get('currency'),3)||'USD').toUpperCase(),status,occurred_at:clean(formData.get('occurred_at'),40)||new Date().toISOString(),notes:clean(formData.get('notes'),1000)||null}
 if(!Number.isSafeInteger(payload.gross_cents)||payload.gross_cents<=0||!Number.isSafeInteger(payload.fee_cents)||payload.fee_cents<0||!/^[A-Z]{3}$/.test(payload.currency))redirect('/admin/monetization?error=Invalid+revenue+amount+or+currency')
 if(!/^\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,3})?)?(?:Z|[+-]\d{2}:\d{2})?)?$/.test(payload.occurred_at)||!Number.isFinite(Date.parse(payload.occurred_at))||!validCalendarDate(payload.occurred_at.slice(0,10)))redirect('/admin/monetization?error=Invalid+revenue+date')
 if(payload.fee_cents>payload.gross_cents)redirect('/admin/monetization?error=Transaction+fees+cannot+exceed+gross+revenue')
 const {error}=await service.from('monetization_transactions').insert(payload)
 redirect('/admin/monetization?'+(error?'error='+encodeURIComponent(error.code==='23505'?'That external transaction has already been recorded.':'Revenue entry could not be saved.'):'message=Revenue+recorded'))
}

export async function createSponsorship(formData:FormData){
 const service=await requireAdmin()
 const name=clean(formData.get('name'),160),sponsor_name=clean(formData.get('sponsor_name'),160),placement=clean(formData.get('placement'),120)
 if(!name||!sponsor_name||!placement)redirect('/admin/monetization?error=Campaign+name%2C+sponsor+and+placement+are+required')
 const status=clean(formData.get('status'),30)||'draft'
 const budgetRaw=clean(formData.get('budget'),30)
 const payload={name,sponsor_name,placement,status:['draft','scheduled','active','paused','completed','cancelled'].includes(status)?status:'draft',destination_url:clean(formData.get('destination_url'),1000)||null,starts_at:clean(formData.get('starts_at'),40)||null,ends_at:clean(formData.get('ends_at'),40)||null,budget_cents:budgetRaw?cents(formData.get('budget')):null,currency:(clean(formData.get('currency'),3)||'USD').toUpperCase(),disclosure_label:clean(formData.get('disclosure_label'),80)||'Sponsored',notes:clean(formData.get('notes'),1000)||null}
 if(!/^[A-Z]{3}$/.test(payload.currency)||payload.budget_cents!==null&&(!Number.isSafeInteger(payload.budget_cents)||payload.budget_cents<=0))redirect('/admin/monetization?error=Invalid+campaign+budget+or+currency')
 const validCampaignTimestamp=(value:string|null)=>value===null||(/^\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}(?::\d{2})?(?:Z|[+-]\d{2}:\d{2})?)?$/.test(value)&&validCalendarDate(value.slice(0,10))&&Number.isFinite(Date.parse(value)))
 if(!validCampaignTimestamp(payload.starts_at)||!validCampaignTimestamp(payload.ends_at)||(payload.starts_at!==null&&payload.ends_at!==null&&Date.parse(payload.ends_at)<Date.parse(payload.starts_at)))redirect('/admin/monetization?error=Invalid+campaign+date+range')
 const {error}=await service.from('sponsorship_campaigns').insert(payload)
 redirect('/admin/monetization?'+(error?'error=Campaign+could+not+be+saved':'message=Sponsorship+campaign+created'))
}

export async function updateSponsorshipStatus(formData:FormData){
 const service=await requireAdmin()
 const id=Number(formData.get('id')),status=clean(formData.get('status'),30)
 if(!Number.isSafeInteger(id)||id<=0||!['draft','scheduled','active','paused','completed','cancelled'].includes(status))redirect('/admin/monetization?error=Invalid+campaign+update')
 const {error}=await service.from('sponsorship_campaigns').update({status,updated_at:new Date().toISOString()}).eq('id',id)
 redirect('/admin/monetization?'+(error?'error=Campaign+could+not+be+updated':'message=Campaign+updated'))
}

export async function updateMembershipPlan(formData:FormData){
 const service=await requireAdmin()
 const id=Number(formData.get('id')),name=clean(formData.get('name'),120),description=clean(formData.get('description'),500),interval=clean(formData.get('billing_interval'),20),currency=(clean(formData.get('currency'),3)||'USD').toUpperCase()
 const price=cents(formData.get('price')),entitlements=clean(formData.get('entitlements'),1000).split(',').map(x=>x.trim()).filter(Boolean)
 if(!Number.isSafeInteger(id)||id<=0||!name||!['month','year','one_time'].includes(interval)||!/^[A-Z]{3}$/.test(currency)||!Number.isSafeInteger(price)||price<=0)redirect('/admin/monetization?error=Invalid+membership+plan')
 const {error}=await service.from('membership_plans').update({name,description:description||null,price_cents:price,billing_interval:interval,currency,entitlements,is_active:formData.get('is_active')==='on',updated_at:new Date().toISOString()}).eq('id',id)
 redirect('/admin/monetization?'+(error?'error=Membership+plan+could+not+be+updated':'message=Membership+plan+updated'))
}

export async function grantMembership(formData:FormData){
 const service=await requireAdmin()
 const email=clean(formData.get('email'),320).toLowerCase(),planId=Number(formData.get('plan_id')),days=Number(formData.get('days')||30)
 if(!email||!Number.isSafeInteger(planId)||planId<=0||!Number.isSafeInteger(days)||days<1||days>3660)redirect('/admin/monetization?error=Valid+member%2C+plan+and+duration+are+required')
 const {data:users,error:userError}=await service.auth.admin.listUsers({page:1,perPage:1000})
 const user=users?.users?.find(x=>String(x.email||'').toLowerCase()===email)
 if(userError||!user)redirect('/admin/monetization?error=No+account+was+found+for+that+email')
 const {data:plan}=await service.from('membership_plans').select('id,slug').eq('id',planId).eq('is_active',true).maybeSingle()
 if(!plan||plan.slug==='free')redirect('/admin/monetization?error=Choose+an+active+premium+plan')
 const now=new Date(),end=new Date(now.getTime()+days*86400000)
 await service.from('member_subscriptions').update({status:'expired',updated_at:now.toISOString()}).eq('user_id',user.id).eq('provider','manual').in('status',['trialing','active','past_due','cancelled'])
 const {error}=await service.from('member_subscriptions').insert({user_id:user.id,plan_id:plan.id,provider:'manual',status:'active',current_period_start:now.toISOString(),current_period_end:end.toISOString(),cancel_at_period_end:false})
 redirect('/admin/monetization?'+(error?'error=Membership+could+not+be+granted':'message=Membership+granted'))
}

export async function endManualMembership(formData:FormData){
 const service=await requireAdmin(),id=Number(formData.get('id'))
 if(!Number.isSafeInteger(id)||id<=0)redirect('/admin/monetization?error=Invalid+membership')
 const {error}=await service.from('member_subscriptions').update({status:'cancelled',current_period_end:new Date().toISOString(),cancel_at_period_end:true,updated_at:new Date().toISOString()}).eq('id',id).eq('provider','manual')
 redirect('/admin/monetization?'+(error?'error=Membership+could+not+be+ended':'message=Manual+membership+ended'))
}

export async function importAffiliateCommissions(formData:FormData){
 const service=await requireAdmin(),file=formData.get('file'),source=clean(formData.get('source_name'),120)||'affiliate_import'
 if(!(file instanceof File)||file.size===0||file.size>2_000_000)redirect('/admin/monetization?error=Choose+a+CSV+file+under+2MB')
 const parsed=parseAffiliateCommissionCsv(await file.text(),source)
 if(parsed.errors.length)redirect('/admin/monetization?error='+encodeURIComponent(parsed.errors.slice(0,3).join(' ')))
 if(!parsed.rows.length)redirect('/admin/monetization?error=No+valid+commission+rows+were+found')
 const clickIds=[...new Set(parsed.rows.map(x=>x.affiliate_click_id).filter((x):x is number=>!!x))],offerIds=[...new Set(parsed.rows.map(x=>x.affiliate_offer_id).filter((x):x is number=>!!x))]
 const {data:clickRows}=clickIds.length?await service.from('affiliate_clicks').select('id,offer_id,perfume_id,placement').in('id',clickIds):{data:[]}
 for(const click of clickRows||[])if(click.offer_id)offerIds.push(Number(click.offer_id))
 const uniqueOfferIds=[...new Set(offerIds)],{data:offerRows}=uniqueOfferIds.length?await service.from('perfume_affiliate_offers').select('id,perfume_id,merchant_name').in('id',uniqueOfferIds):{data:[]}
 const enriched=enrichAffiliateRows(parsed.rows,clickRows||[],offerRows||[])
 const keys=enriched.map(x=>x.external_id),{data:existing}=await service.from('monetization_transactions').select('external_id').eq('source_name',source).in('external_id',keys)
 const existingIds=new Set((existing||[]).map((x:any)=>String(x.external_id))),fresh=enriched.filter(x=>!existingIds.has(x.external_id)),quality=affiliateImportQuality(fresh)
 const payload=fresh.map(row=>({...row,revenue_type:'affiliate'}))
 const {error}=payload.length?await service.from('monetization_transactions').insert(payload):{error:null}
 const duplicateCount=parsed.rows.length-fresh.length
 const summary=quality.total+' inserted, '+duplicateCount+' duplicates skipped, '+quality.unattributed+' need attribution'
 redirect('/admin/monetization?'+(error?'error=Affiliate+commissions+could+not+be+imported':'message='+encodeURIComponent(summary)))
}


export async function updateAffiliateAttribution(formData:FormData){
 const service=await requireAdmin()
 const id=Number(formData.get('id'))
 if(!Number.isSafeInteger(id)||id<=0)redirect('/admin/monetization/review?error=Invalid+commission')
 const numberOrNull=(name:string)=>{const raw=clean(formData.get(name),40);if(!raw)return null;const n=Number(raw);return Number.isSafeInteger(n)&&n>0?n:null}
 const offerId=numberOrNull('affiliate_offer_id'),clickId=numberOrNull('affiliate_click_id')
 const merchant=clean(formData.get('affiliate_merchant'),160)||null,placement=clean(formData.get('affiliate_placement'),160)||null,perfumeId=clean(formData.get('perfume_id'),160)||null
 if(formData.get('affiliate_offer_id')&&offerId===null)redirect('/admin/monetization/review?error=Offer+ID+must+be+a+positive+number')
 if(formData.get('affiliate_click_id')&&clickId===null)redirect('/admin/monetization/review?error=Click+ID+must+be+a+positive+number')
 const {data:click}=clickId?await service.from('affiliate_clicks').select('id,offer_id,perfume_id,placement').eq('id',clickId).maybeSingle():{data:null}
 if(clickId&&!click)redirect('/admin/monetization/review?error=Tracked+click+was+not+found')
 const effectiveOfferId=offerId||click?.offer_id||null
 const {data:offer}=effectiveOfferId?await service.from('perfume_affiliate_offers').select('id,perfume_id,merchant_name').eq('id',effectiveOfferId).maybeSingle():{data:null}
 if(offerId&&!offer)redirect('/admin/monetization/review?error=Affiliate+offer+was+not+found')
 const {data:before}=await service.from('monetization_transactions').select('affiliate_offer_id,affiliate_click_id,affiliate_merchant,affiliate_placement,perfume_id').eq('id',id).eq('revenue_type','affiliate').maybeSingle()
 if(!before)redirect('/admin/monetization/review?error=Commission+was+not+found')
 const after={affiliate_offer_id:offerId,affiliate_click_id:clickId,affiliate_merchant:merchant,affiliate_placement:placement,perfume_id:perfumeId}
 const reconciliation=reconcileAffiliateRow({...before,...after} as any,click?[click as any]:[],offer?[offer as any]:[])
 if(reconciliation.state==='conflict')redirect('/admin/monetization/review?error='+encodeURIComponent('Attribution conflicts with tracked data: '+reconciliation.reasons.join(', ').replaceAll('_',' ')))
 const changedBy=(await (await createClient()).auth.getUser()).data.user?.id||null
 const {data:saved,error}=await service.rpc('update_affiliate_attribution_with_audit',{p_transaction_id:id,p_offer_id:offerId,p_click_id:clickId,p_merchant:merchant,p_placement:placement,p_perfume_id:perfumeId,p_changed_by:changedBy})
 redirect('/admin/monetization/review?'+(error||saved!==true?'error=Commission+attribution+could+not+be+saved':'message=Commission+attribution+updated'))
}


export async function bulkEnrichAffiliateAttribution(){
 const service=await requireAdmin(),pageSize=250;let updated=0,lastId=0
 for(;;){
  const {data,error}=await service.from('monetization_transactions').select('id,source_name,external_id,gross_cents,fee_cents,currency,status,occurred_at,affiliate_offer_id,affiliate_click_id,affiliate_merchant,affiliate_placement,perfume_id').eq('revenue_type','affiliate').not('affiliate_click_id','is',null).gt('id',lastId).order('id',{ascending:true}).limit(pageSize)
  if(error)redirect('/admin/monetization/review?error=Affiliate+commissions+could+not+be+loaded')
  const batch=data||[];if(!batch.length)break;lastId=batch[batch.length-1].id
  const incomplete=batch.filter((x:any)=>!x.affiliate_offer_id||!x.affiliate_merchant||!x.affiliate_placement||!x.perfume_id)
  if(!incomplete.length){if(batch.length<pageSize)break;continue}
  const clickIds=[...new Set(incomplete.map((x:any)=>x.affiliate_click_id).filter(Boolean))],clicks:any[]=[]
  for(let i=0;i<clickIds.length;i+=100){const {data:rows,error:e}=await service.from('affiliate_clicks').select('id,offer_id,perfume_id,placement').in('id',clickIds.slice(i,i+100));if(e)redirect('/admin/monetization/review?error=Affiliate+clicks+could+not+be+loaded');clicks.push(...(rows||[]))}
  const offerIds=[...new Set([...incomplete.map((x:any)=>x.affiliate_offer_id),...clicks.map((x:any)=>x.offer_id)].filter(Boolean))],offers:any[]=[]
  for(let i=0;i<offerIds.length;i+=100){const {data:rows,error:e}=await service.from('perfume_affiliate_offers').select('id,perfume_id,merchant_name').in('id',offerIds.slice(i,i+100));if(e)redirect('/admin/monetization/review?error=Affiliate+offers+could+not+be+loaded');offers.push(...(rows||[]))}
  const enriched=enrichAffiliateRows(incomplete as any,clicks,offers)
  for(let i=0;i<incomplete.length;i++){const before:any=incomplete[i],after:any=enriched[i]
   if(reconcileAffiliateRow(before,clicks,offers).state!=='enrichable')continue
   const patch:any={};for(const k of ['affiliate_offer_id','affiliate_merchant','affiliate_placement','perfume_id'])if(!before[k]&&after[k])patch[k]=after[k]
   if(Object.keys(patch).length){const {data:saved}=await service.rpc('enrich_affiliate_attribution_with_audit',{p_transaction_id:before.id,p_offer_id:patch.affiliate_offer_id||null,p_merchant:patch.affiliate_merchant||null,p_placement:patch.affiliate_placement||null,p_perfume_id:patch.perfume_id||null});if(saved===true)updated++}
  }
  if(batch.length<pageSize)break
 }
 redirect('/admin/monetization/review?message='+encodeURIComponent(updated+' verified commission records auto-filled'))
}

export async function updateRevenueGoal(formData:FormData){
 const service=await requireAdmin()
 const goalCents=cents(formData.get('monthly_goal'))
 const currency=clean(formData.get('currency'),3).toUpperCase()||'USD'
 const now=new Date(),monthStart=new Date(Date.UTC(now.getUTCFullYear(),now.getUTCMonth(),1)).toISOString().slice(0,10)
 const {error}=await service.from('monetization_settings').upsert({id:'default',monthly_revenue_goal_cents:goalCents,currency,updated_at:now.toISOString()},{onConflict:'id'})
 if(!error)await service.from('monetization_goal_history').upsert({month_start:monthStart,goal_cents:goalCents,currency,updated_at:now.toISOString()},{onConflict:'month_start'})
 redirect('/admin/monetization?'+(error?'error=Revenue+goal+could+not+be+saved':'message=Revenue+goal+updated'))
}

export async function recordExpense(formData:FormData){
 const service=await requireAdmin()
 const category=clean(formData.get('category'),30),vendor=clean(formData.get('vendor'),120),description=clean(formData.get('description'),300),amountCents=cents(formData.get('amount')),currency=clean(formData.get('currency'),3).toUpperCase()||'USD',incurredAt=clean(formData.get('incurred_at'),10)||new Date().toISOString().slice(0,10)
 if(!['hosting','software','marketing','contractor','legal','accounting','content','other'].includes(category)||!Number.isSafeInteger(amountCents)||amountCents<=0||!/^[A-Z]{3}$/.test(currency)||!validExpenseDate(incurredAt))redirect('/admin/monetization?error=Invalid+expense')
 const {error}=await service.from('monetization_expenses').insert({category,vendor:vendor||null,description:description||null,amount_cents:amountCents,currency,incurred_at:incurredAt})
 redirect('/admin/monetization?'+(error?'error=Expense+could+not+be+saved':'message=Expense+recorded'))
}

export async function updateExpense(formData:FormData){
 const service=await requireAdmin(),id=Number(formData.get('id')),category=clean(formData.get('category'),30),vendor=clean(formData.get('vendor'),120),description=clean(formData.get('description'),300),amountCents=cents(formData.get('amount')),currency=clean(formData.get('currency'),3).toUpperCase()||'USD',incurredAt=clean(formData.get('incurred_at'),10)
 if(!Number.isSafeInteger(id)||id<=0||!['hosting','software','marketing','contractor','legal','accounting','content','other'].includes(category)||!Number.isSafeInteger(amountCents)||amountCents<=0||!/^[A-Z]{3}$/.test(currency)||!validExpenseDate(incurredAt))redirect('/admin/monetization?error=Invalid+expense')
 const {error}=await service.from('monetization_expenses').update({category,vendor:vendor||null,description:description||null,amount_cents:amountCents,currency,incurred_at:incurredAt}).eq('id',id)
 redirect('/admin/monetization?'+(error?'error=Expense+could+not+be+updated':'message=Expense+updated'))
}
export async function deleteExpense(formData:FormData){
 const service=await requireAdmin(),id=Number(formData.get('id'))
 if(!Number.isSafeInteger(id)||id<=0)redirect('/admin/monetization?error=Invalid+expense')
 const {error}=await service.from('monetization_expenses').delete().eq('id',id)
 redirect('/admin/monetization?'+(error?'error=Expense+could+not+be+deleted':'message=Expense+deleted'))
}
