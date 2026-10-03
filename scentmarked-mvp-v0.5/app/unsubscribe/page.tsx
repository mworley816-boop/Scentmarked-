import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export const dynamic='force-dynamic'
export const metadata={title:'Email Preferences',robots:{index:false,follow:false}}

export default async function Unsubscribe({searchParams}:{searchParams:Promise<{token?:string}>}){
  const {token}=await searchParams
  const valid=typeof token==='string'&&/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(token)
  let success=false
  if(valid){
    try{
      const s=await createClient()
      const {data,error}=await s.rpc('unsubscribe_crm_contact',{p_token:token})
      success=!error&&data===true
    }catch{}
  }
  return <main><section className="quiz-page"><div className="quiz-shell">
    <p className="eyebrow">SCENTMARKED EMAIL PREFERENCES</p>
    <h1>{success?'You’re unsubscribed.':'We couldn’t update that email preference.'}</h1>
    {success
      ?<p>You will no longer receive ScentMarked marketing emails. Your ScentMarked account, saved perfumes, and scent profile are unchanged.</p>
      :<p>This unsubscribe link is invalid or unavailable. No account or email preferences were changed.</p>}
    <div className="quiz-actions"><Link className="button" href="/">Return to ScentMarked</Link></div>
  </div></section></main>
}
