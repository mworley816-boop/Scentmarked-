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
 const [{data:profile,error:profileError},{data:feedback},{data:collection},{data:ratings},{data:history}]=await Promise.all([
  supabase.from('profiles').select('display_name,is_admin,scent_profile_completed_at,scent_loved_notes,scent_avoided_notes,scent_presentations,scent_sweetness,scent_projection,scent_longevity,scent_max_price').eq('id',user.id).maybeSingle(),
  supabase.from('recommendation_feedback').select('feedback'),
  supabase.from('collection_items').select('status').eq('user_id',user.id),
  supabase.from('ratings').select('overall').eq('user_id',user.id),
  supabase.from('recommendation_history').select('created_at,result_count').eq('user_id',user.id).order('created_at',{ascending:false}).limit(5)
 ])
 const taste={more:(feedback||[]).filter((x:any)=>x.feedback==='more_like_this').length,less:(feedback||[]).filter((x:any)=>x.feedback==='less_like_this').length,favorites:(collection||[]).filter((x:any)=>x.status==='favorite').length,highRated:(ratings||[]).filter((x:any)=>Number(x.overall)>=4).length}
 return <main><section className="legal-page account-settings">
  <p className="eyebrow">YOUR ACCOUNT</p><h1 className="page-title">Account Settings</h1><p>Manage your Scentmarked profile, password, and privacy controls.</p>
  {profileError&&<div className="notice error" role="status"><p>Some account details could not be loaded. You can still use the controls below, but profile information and admin access may be temporarily unavailable.</p></div>}
  {profile?.is_admin&&<p><Link className="button ghost" href="/admin">Open Admin Studio</Link></p>}
  {p.error&&<div className="notice error" role="alert"><p>{p.error}</p>{p.error.includes('contact Scentmarked')&&<p><Link className="text-link" href="/contact">Contact Scentmarked →</Link></p>}</div>}
  {p.message&&<div className="notice" role="status">{p.message}</div>}
  <h2>Profile</h2><form action={updateProfile} className="auth-card"><label>Display name<input name="display_name" defaultValue={profile?.display_name||''} maxLength={80} autoComplete="name"/></label><label>Email<input value={user.email||''} disabled readOnly/></label><button className="button" type="submit">Save Profile</button></form>
  <h2>Scent Profile</h2><p>Update your favorite fragrances, scent families, notes, presentation, vibe, occasions, sweetness, projection, longevity, and budget.</p><p className="muted">Recommendations currently rank from your notes, saved favorite references, presentation, wear preferences, and budget. Vibe and occasion answers are saved to your profile for future matching improvements. You can change these answers anytime.</p><Link className="button ghost" href="/onboarding">Edit My Scent Profile</Link>
  <h2>Your Taste Profile</h2><div className="taste-profile-card"><div><p className="eyebrow">SAVED PREFERENCES</p><p><b>Loved notes:</b> {(profile?.scent_loved_notes||[]).length?(profile?.scent_loved_notes||[]).join(', '):'Not set yet'}</p><p><b>Avoid:</b> {(profile?.scent_avoided_notes||[]).length?(profile?.scent_avoided_notes||[]).join(', '):'None saved'}</p><p><b>Presentation:</b> {(profile?.scent_presentations||[]).length?(profile?.scent_presentations||[]).join(', '):'No preference'}</p><p><b>Wear profile:</b> Sweetness {profile?.scent_sweetness||'—'}/5 · Projection {profile?.scent_projection||'—'}/5 · Longevity {profile?.scent_longevity||'—'}/5</p><p><b>Budget:</b> {profile?.scent_max_price?'Up to $'+profile.scent_max_price:'No maximum saved'}</p></div><div><p className="eyebrow">WHAT SCENTMARKED HAS LEARNED</p><p>{taste.more} More Like This · {taste.less} Less Like This</p><p>{taste.highRated} highly rated · {taste.favorites} collection favorites</p><p className="muted">These activity signals adjust recommendation ordering while your displayed scent-match percentage remains based on fragrance and preference fit.</p></div></div>
  <div className="result-actions"><Link className="button" href="/matches">View My Recommendations</Link><Link className="button ghost" href="/onboarding">Update Taste Profile</Link></div>
  <h2>Recent Recommendation Activity</h2>{history?.length?<div className="taste-history">{history.map((x:any,i:number)=><div key={String(x.created_at)+i}><b>{new Date(x.created_at).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})}</b><span>{Number(x.result_count)||0} recommendation{Number(x.result_count)===1?'':'s'} generated</span></div>)}</div>:<div className="empty-state"><h3>No recommendation history yet</h3><p>Run your first personalized match to start building your recommendation activity.</p><Link className="button" href="/matches">Find My Matches</Link></div>}<p className="muted">This timeline records recommendation activity. It does not claim your fragrance taste changed unless your saved preferences or feedback actually changed.</p>
  <h2>Password</h2><p>If you need a new password, use Scentmarked's secure email recovery flow.</p><Link className="button ghost" href="/login">Reset Password</Link>
  <h2>Privacy</h2><p>Your saved fragrances, ratings, reviews, recommendation preferences, and other account activity are associated with your account so member features can work. See the <Link href="/privacy">Privacy Policy</Link> for more information.</p>
  <div className="notice error"><h2>Delete account</h2><p>This permanently deletes your Scentmarked authentication account. Data tied to your account is removed according to the database's configured account-deletion rules. This action cannot be undone.</p><form action={deleteAccount}><p id="delete-account-help" className="muted">Type DELETE below. Capitalization does not matter; extra words are not accepted.</p><label>Type <strong>DELETE</strong> to confirm<input name="confirmation" required autoComplete="off" title="Type DELETE to confirm. Capitalization does not matter." placeholder="DELETE" aria-describedby="delete-account-help"/></label><button type="submit">Permanently Delete My Account</button></form></div>
 </section></main>
}
