import Link from 'next/link'
import { submitContact } from './actions'

export const metadata={title:'Contact & Feedback',description:'Contact Scentmarked about fragrance data, corrections, community issues, privacy, rights concerns or general feedback.',alternates:{canonical:'/contact'}}

export default async function Contact({searchParams}:{searchParams:Promise<{sent?:string;error?:string}>}){
 const p=await searchParams
 return <main><section className="legal-page"><p className="eyebrow">CONTACT & FEEDBACK</p><h1 className="page-title">Help us make Scentmarked better.</h1><p className="lede">Use this form for catalog corrections, missing fragrances, community concerns, privacy questions, image or rights concerns, and general feedback.</p>
 {p.sent==='1'&&<div className="notice">Thanks — your message was sent to Scentmarked.</div>}{p.error&&<div className="notice error">{p.error}</div>}
 <form action={submitContact} className="auth-card"><label>Name<input name="name" required maxLength={100} autoComplete="name"/></label><label>Email<input name="email" type="email" required maxLength={254} autoComplete="email"/></label><label>Topic<select name="category" defaultValue="general"><option value="general">General feedback</option><option value="catalog">Catalog correction</option><option value="missing_fragrance">Missing fragrance</option><option value="community">Community concern</option><option value="privacy">Privacy question</option><option value="rights">Image or rights concern</option></select></label><label>Subject<input name="subject" required maxLength={160}/></label><label>Message<textarea name="message" required maxLength={4000} rows={7}/></label><button className="button" type="submit">Send Message</button></form>
 <h2>Catalog corrections</h2><p>Include the fragrance name, brand, the information that needs review and a reliable source when possible.</p><h2>Community concerns</h2><p>If community content appears to violate the <Link href="/community-guidelines">Community Guidelines</Link>, identify the fragrance and content that needs review.</p><h2>Privacy</h2><p>Signed-in members can permanently delete their account from <Link href="/account">Account Settings</Link>. Use this form for other privacy questions. Do not include passwords, payment details, or other highly sensitive information.</p>
 </section></main>
}
