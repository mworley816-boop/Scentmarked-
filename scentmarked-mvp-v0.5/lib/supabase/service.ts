import { createClient } from '@supabase/supabase-js'
import { publicSupabaseConfig } from './config'

export function createServiceClient(){
  const {url}=publicSupabaseConfig()
  const serviceRoleKey=(process.env.SUPABASE_SERVICE_ROLE_KEY||'').trim()
  if(!serviceRoleKey)throw new Error('Supabase service role is not configured.')
  return createClient(url,serviceRoleKey,{
    auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}
  })
}
