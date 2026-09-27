import {createBrowserClient} from '@supabase/ssr';

const url='https://qnlqdkctfmfagsvbwiis.supabase.co'
const publishableKey='sb_publishable_DhzPVepdeQt-1Xt00CBOsw_cl30TcYp'

export function createClient(){
 return createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL||url,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY||publishableKey
 )
}
