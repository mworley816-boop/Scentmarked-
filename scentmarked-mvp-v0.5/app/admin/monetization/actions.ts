'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

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
