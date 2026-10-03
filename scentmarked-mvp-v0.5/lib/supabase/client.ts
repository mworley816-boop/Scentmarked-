import {createBrowserClient} from '@supabase/ssr'
import {publicSupabaseConfig} from './config'

export function createClient(){
 const {url,publishableKey}=publicSupabaseConfig()
 return createBrowserClient(url,publishableKey)
}
