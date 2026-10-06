'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { parseAffiliateCommissionCsv, affiliateImportQuality } from '@/lib/affiliate-import'
import { enrichAffiliateRows } from '@/lib/affiliate-enrichment'

const clean=(v:FormDataEntryValue|null,max=200)=>String(v||'').trim().slice(0,max)
const cents=(v:FormDataEntryValue|null)=>Math.max(0,Math.round(Number(v||0)*100))

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
 const payload={revenue_type,source_name,external_id:clean(formData.get('external_id'),160)||null,gross_cents:cents(formData.get('gross')),fee_cents:cents(formData.get('fees')),currency:(clean(formData.get('currency'),3)||'USD').toUpperCase(),status,occurred_at:clean(formData.get('occurred_at'),40)||new Date().toISOString(),notes:clean(formData.get('notes'),1000)||null}
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
 const {error}=await service.from('sponsorship_campaigns').insert(payload)
 redirect('/admin/monetization?'+(error?'error=Campaign+could+not+be+saved':'message=Sponsorship+campaign+created'))
}

export async function updateSponsorshipStatus(formData:FormData){
 const service=await requireAdmin()
 const id=Number(formData.get('id')),status=clean(formData.get('status'),30)
 if(!Number.isInteger(id)||!['draft','scheduled','active','paused','completed','cancelled'].includes(status))redirect('/admin/monetization?error=Invalid+campaign+update')
 const {error}=await service.from('sponsorship_campaigns').update({status,updated_at:new Date().toISOString()}).eq('id',id)
 redirect('/admin/monetization?'+(error?'error=Campaign+could+not+be+updated':'message=Campaign+updated'))
}

export async function updateMembershipPlan(formData:FormData){
 const service=await requireAdmin()
 const id=Number(formData.get('id')),name=clean(formData.get('name'),120),description=clean(formData.get('description'),500),interval=clean(formData.get('billing_interval'),20),currency=(clean(formData.get('currency'),3)||'USD').toUpperCase()
 const price=cents(formData.get('price')),entitlements=clean(formData.get('entitlements'),1000).split(',').map(x=>x.trim()).filter(Boolean)
 if(!Number.isInteger(id)||!name||!['month','year','one_time'].includes(interval)||currency.length!==3)redirect('/admin/monetization?error=Invalid+membership+plan')
 const {error}=await service.from('membership_plans').update({name,description:description||null,price_cents:price,billing_interval:interval,currency,entitlements,is_active:formData.get('is_active')==='on',updated_at:new Date().toISOString()}).eq('id',id)
 redirect('/admin/monetization?'+(error?'error=Membership+plan+could+not+be+updated':'message=Membership+plan+updated'))
}

export async function grantMembership(formData:FormData){
 const service=await requireAdmin()
 const email=clean(formData.get('email'),320).toLowerCase(),planId=Number(formData.get('plan_id')),days=Math.min(3660,Math.max(1,Number(formData.get('days')||30)))
 if(!email||!Number.isInteger(planId))redirect('/admin/monetization?error=Member+email+and+plan+are+required')
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
 if(!Number.isInteger(id))redirect('/admin/monetization?error=Invalid+membership')
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
 if(!Number.isInteger(id)||id<=0)redirect('/admin/monetization/review?error=Invalid+commission')
 const numberOrNull=(name:string)=>{const raw=clean(formData.get(name),40);if(!raw)return null;const n=Number(raw);return Number.isInteger(n)&&n>0?n:null}
 const offerId=numberOrNull('affiliate_offer_id'),clickId=numberOrNull('affiliate_click_id')
 const merchant=clean(formData.get('affiliate_merchant'),160)||null,placement=clean(formData.get('affiliate_placement'),160)||null,perfumeId=clean(formData.get('perfume_id'),160)||null
 if(formData.get('affiliate_offer_id')&&offerId===null)redirect('/admin/monetization/review?error=Offer+ID+must+be+a+positive+number')
 if(formData.get('affiliate_click_id')&&clickId===null)redirect('/admin/monetization/review?error=Click+ID+must+be+a+positive+number')
 if(clickId){const {data:click}=await service.from('affiliate_clicks').select('id').eq('id',clickId).maybeSingle();if(!click)redirect('/admin/monetization/review?error=Tracked+click+was+not+found')}
 if(offerId){const {data:offer}=await service.from('perfume_affiliate_offers').select('id').eq('id',offerId).maybeSingle();if(!offer)redirect('/admin/monetization/review?error=Affiliate+offer+was+not+found')}
 const {data:before}=await service.from('monetization_transactions').select('affiliate_offer_id,affiliate_click_id,affiliate_merchant,affiliate_placement,perfume_id').eq('id',id).eq('revenue_type','affiliate').maybeSingle()
 if(!before)redirect('/admin/monetization/review?error=Commission+was+not+found')
 const after={affiliate_offer_id:offerId,affiliate_click_id:clickId,affiliate_merchant:merchant,affiliate_placement:placement,perfume_id:perfumeId}
 const {error}=await service.from('monetization_transactions').update(after).eq('id',id).eq('revenue_type','affiliate')
 if(!error)await service.from('affiliate_attribution_audit').insert({transaction_id:id,changed_by:(await (await createClient()).auth.getUser()).data.user?.id||null,change_source:'manual',before_values:before,after_values:after})
 redirect('/admin/monetization/review?'+(error?'error=Commission+attribution+could+not+be+saved':'message=Commission+attribution+updated'))
}


export async function bulkEnrichAffiliateAttribution(){
 const service=await requireAdmin()
 const {data:tx}=await service.from('monetization_transactions').select('id,source_name,external_id,gross_cents,fee_cents,currency,status,occurred_at,affiliate_offer_id,affiliate_click_id,affiliate_merchant,affiliate_placement,perfume_id').eq('revenue_type','affiliate').not('affiliate_click_id','is',null)
 const incomplete=(tx||[]).filter((x:any)=>!x.affiliate_offer_id||!x.affiliate_merchant||!x.affiliate_placement||!x.perfume_id)
 const clickIds=[...new Set(incomplete.map((x:any)=>x.affiliate_click_id).filter(Boolean))]
 const {data:clicks}=clickIds.length?await service.from('affiliate_clicks').select('id,offer_id,perfume_id,placement').in('id',clickIds):{data:[]}
 const offerIds=[...new Set((clicks||[]).map((x:any)=>x.offer_id).filter(Boolean))]
 const {data:offers}=offerIds.length?await service.from('perfume_affiliate_offers').select('id,perfume_id,merchant_name').in('id',offerIds):{data:[]}
 const enriched=enrichAffiliateRows(incomplete as any,clicks||[],offers||[]);let updated=0
 for(let i=0;i<incomplete.length;i++){const before:any=incomplete[i],after:any=enriched[i]
  const click:any=(clicks||[]).find((x:any)=>x.id===before.affiliate_click_id)
  if(!click)continue
  if(before.affiliate_offer_id&&click.offer_id&&before.affiliate_offer_id!==click.offer_id)continue
  if(before.perfume_id&&click.perfume_id&&before.perfume_id!==click.perfume_id)continue
  const patch:any={};for(const k of ['affiliate_offer_id','affiliate_merchant','affiliate_placement','perfume_id'])if(!before[k]&&after[k])patch[k]=after[k]
  if(Object.keys(patch).length){const afterValues={affiliate_offer_id:before.affiliate_offer_id,affiliate_click_id:before.affiliate_click_id,affiliate_merchant:before.affiliate_merchant,affiliate_placement:before.affiliate_placement,perfume_id:before.perfume_id,...patch};const {error}=await service.from('monetization_transactions').update(patch).eq('id',before.id);if(!error){updated++;await service.from('affiliate_attribution_audit').insert({transaction_id:before.id,changed_by:null,change_source:'automatic',before_values:{affiliate_offer_id:before.affiliate_offer_id,affiliate_click_id:before.affiliate_click_id,affiliate_merchant:before.affiliate_merchant,affiliate_placement:before.affiliate_placement,perfume_id:before.perfume_id},after_values:afterValues})}}
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
