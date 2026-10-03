export const defaultSupabaseUrl='https://qnlqdkctfmfagsvbwiis.supabase.co'
export const defaultSupabasePublishableKey='sb_publishable_DhzPVepdeQt-1Xt00CBOsw_cl30TcYp'

export function publicSupabaseConfig(){
 return {
  url:process.env.NEXT_PUBLIC_SUPABASE_URL||defaultSupabaseUrl,
  publishableKey:process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY||defaultSupabasePublishableKey
 }
}
