import {createServerClient} from '@supabase/ssr'
import {cookies} from 'next/headers'
import {publicSupabaseConfig} from './config'

export async function createClient(){
 const store=await cookies()
 const {url,publishableKey}=publicSupabaseConfig()
 return createServerClient(url,publishableKey,{cookies:{getAll(){return store.getAll()},setAll(items){try{items.forEach(({name,value,options})=>store.set(name,value,options))}catch{}}}})
}
