'use server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

function accountUrl(kind:'error'|'message',message:string){return '/account?'+kind+'='+encodeURIComponent(message)}

export async function updateProfile(formData:FormData){
 const displayName=String(formData.get('display_name')||'').trim().slice(0,80)
 const supabase=await createClient()
 const {data:{user}}=await supabase.auth.getUser()
 if(!user)redirect('/login?next='+encodeURIComponent('/account'))
 const {error}=await supabase.from('profiles').update({display_name:displayName||null}).eq('id',user.id)
 if(error)redirect(accountUrl('error',error.message))
 redirect(accountUrl('message','Profile updated.'))
}

export async function deleteAccount(formData:FormData){
 const confirmation=String(formData.get('confirmation')||'').trim().toUpperCase()
 if(confirmation!=='DELETE')redirect(accountUrl('error','Type DELETE to confirm permanent account deletion.'))
 const supabase=await createClient()
 const {data:{user}}=await supabase.auth.getUser()
 if(!user)redirect('/login?next='+encodeURIComponent('/account'))
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL
 const serviceKey=process.env.SUPABASE_SERVICE_ROLE_KEY
 if(!url||!serviceKey)redirect(accountUrl('error','Account deletion is not configured yet. Please contact Scentmarked.'))
 const admin=createAdminClient(url,serviceKey,{auth:{autoRefreshToken:false,persistSession:false}})
 const {error}=await admin.auth.admin.deleteUser(user.id)
 if(error)redirect(accountUrl('error','Account deletion could not be completed. Please try again or contact Scentmarked.'))
 try{await supabase.auth.signOut()}catch{}
 redirect('/?account=deleted')
}
