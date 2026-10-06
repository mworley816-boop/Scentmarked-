'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { parseAffiliateCommissionCsv } from '@/lib/affiliate-import'

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
 const payload=parsed.rows.map(row=>({...row,revenue_type:'affiliate'}))
 const {error}=await service.from('monetization_transactions').upsert(payload,{onConflict:'source_name,external_id',ignoreDuplicates:true})
 redirect('/admin/monetization?'+(error?'error=Affiliate+commissions+could+not+be+imported':'message='+encodeURIComponent(parsed.rows.length+' affiliate commission rows processed')))
}
