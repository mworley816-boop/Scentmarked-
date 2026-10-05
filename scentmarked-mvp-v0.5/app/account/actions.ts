'use server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { publicSupabaseConfig } from '@/lib/supabase/config'
import { hasAccountDeletionConfirmation } from '@/lib/account-deletion'

function accountUrl(kind:'error'|'message',message:string){return '/account?'+kind+'='+encodeURIComponent(message)}

export async function updateProfile(formData:FormData){
 const displayName=String(formData.get('display_name')||'').trim().slice(0,80)
 const supabase=await createClient()
 const {data:{user}}=await supabase.auth.getUser()
 if(!user)redirect('/login?next='+encodeURIComponent('/account'))
 const {data:updated,error}=await supabase.from('profiles').update({display_name:displayName||null}).eq('id',user.id).select('id').maybeSingle()
 if(error||!updated)redirect(accountUrl('error','Profile changes could not be saved. Please try again.'))
 redirect(accountUrl('message','Profile updated.'))
}

export async function updateMarketingPreference(formData:FormData){
 const enabled=String(formData.get('marketing_consent')||'')==='yes'
 const supabase=await createClient()
 const {data:{user}}=await supabase.auth.getUser()
 if(!user)redirect('/login?next='+encodeURIComponent('/account'))
 const {data:updated,error}=await supabase.rpc('set_my_marketing_consent',{p_enabled:enabled})
 if(error){
  const suppressed=enabled&&/suppressed/i.test(String(error.message||''))
  redirect(accountUrl('error',suppressed?'Marketing email cannot be re-enabled for this address yet. Please contact Scentmarked so we can resolve the delivery issue.':'Email preferences could not be saved. Please try again.'))
 }
 if(!updated)redirect(accountUrl('error','Email preferences are not available for this account yet.'))
 redirect(accountUrl('message',enabled?'Marketing emails are enabled.':'Marketing emails are turned off.'))
}

export async function deleteAccount(formData:FormData){
 if(!hasAccountDeletionConfirmation(formData.get('confirmation')))redirect(accountUrl('error','Type DELETE to confirm permanent account deletion.'))
 const supabase=await createClient()
 const {data:{user}}=await supabase.auth.getUser()
 if(!user)redirect('/login?next='+encodeURIComponent('/account'))
 const {url}=publicSupabaseConfig()
 const serviceKey=process.env.SUPABASE_SERVICE_ROLE_KEY
 if(!serviceKey)redirect(accountUrl('error','Account deletion is not configured yet. Please contact Scentmarked.'))
 const admin=createAdminClient(url,serviceKey,{auth:{autoRefreshToken:false,persistSession:false}})
 const {error}=await admin.auth.admin.deleteUser(user.id)
 if(error)redirect(accountUrl('error','Account deletion could not be completed. Please try again or contact Scentmarked.'))
 try{await supabase.auth.signOut()}catch{}
 redirect('/?account=deleted')
}
