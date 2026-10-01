import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { deleteAccount, updateProfile } from './actions'

export const metadata={title:'Account Settings',description:'Manage your Scentmarked account and privacy controls.',robots:{index:false,follow:false}}

export default async function AccountPage({searchParams}:{searchParams:Promise<{error?:string;message?:string}>}){
 const p=await searchParams
 const supabase=await createClient()
 const {data:{user}}=await supabase.auth.getUser()
 if(!user)redirect('/login?next='+encodeURIComponent('/account'))
 const {data:profile,error:profileError}=await supabase.from('profiles').select('display_name,is_admin').eq('id',user.id).maybeSingle()
 return <main><section className="legal-page account-settings"><p className="eyebrow">YOUR ACCOUNT</p><h1 className="page-title">Account Settings</h1><p>Manage your Scentmarked profile, password, and privacy controls.</p>{profileError&&<div className="notice error" role="status"><p>Some account details could not be loaded. You can still use the controls below, but profile information and admin access may be temporarily unavailable.</p></div>}{profile?.is_admin&&<p><Link className="button ghost" href="/admin">Open Admin Studio</Link></p>}{p.error&&<div className="notice error"><p>{p.error}</p>{p.error.includes('contact Scentmarked')&&<p><Link className="text-link" href="/contact">Contact Scentmarked →</Link></p>}</div>}{p.message&&<div className="notice">{p.message}</div>}
 <h2>Profile</h2><form action={updateProfile} className="auth-card"><label>Display name<input name="display_name" defaultValue={profile?.display_name||''} maxLength={80} autoComplete="name"/></label><label>Email<input value={user.email||''} disabled readOnly/></label><button className="button" type="submit">Save Profile</button></form>
 <h2>Password</h2><p>If you need a new password, use Scentmarked's secure email recovery flow.</p><Link className="button ghost" href="/login">Reset Password</Link>
 <h2>Privacy</h2><p>Your saved fragrances, ratings, reviews, recommendation preferences, and other account activity are associated with your account so member features can work. See the <Link href="/privacy">Privacy Policy</Link> for more information.</p>
 <div className="notice error"><h2>Delete account</h2><p>This permanently deletes your Scentmarked authentication account. Data tied to your account is removed according to the database's configured account-deletion rules. This action cannot be undone.</p><form action={deleteAccount}><label>Type <strong>DELETE</strong> to confirm<input name="confirmation" required autoComplete="off" pattern="DELETE" placeholder="DELETE"/></label><button type="submit">Permanently Delete My Account</button></form></div>
 </section></main>
}
