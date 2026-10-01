import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export const dynamic='force-dynamic'
export const metadata={title:'Contact Inbox',robots:{index:false,follow:false}}

async function updateStatus(formData:FormData){'use server';const s=await createClient();const {data:{user}}=await s.auth.getUser();if(!user)redirect('/login?next='+encodeURIComponent('/admin/contact'));const {data:profile}=await s.from('profiles').select('is_admin').eq('id',user.id).maybeSingle();if(!profile?.is_admin)redirect('/');const id=Number(formData.get('id')),status=String(formData.get('status')||'new');if(!Number.isSafeInteger(id)||id<=0||!['new','reviewing','resolved'].includes(status))redirect('/admin/contact');const {error}=await s.from('contact_messages').update({status}).eq('id',id);if(error)redirect('/admin/contact?error='+encodeURIComponent('Message status could not be updated.'));redirect('/admin/contact')}

export default async function AdminContact({searchParams}:{searchParams:Promise<{error?:string}>}){
 const p=await searchParams;const s=await createClient();const {data:{user}}=await s.auth.getUser();if(!user)redirect('/login?next='+encodeURIComponent('/admin/contact'));const {data:profile}=await s.from('profiles').select('is_admin').eq('id',user.id).maybeSingle();if(!profile?.is_admin)redirect('/')
 const {data,error}=await s.from('contact_messages').select('id,created_at,name,email,category,subject,message,status').order('created_at',{ascending:false}).limit(200)
 return <main><section className="admin-page"><div className="admin-heading"><div><p className="eyebrow">ADMIN</p><h1>Contact Inbox</h1><p>Review contact, privacy, catalog, community and rights messages.</p></div><Link className="button ghost" href="/admin">Back to Admin</Link></div>{p.error&&<div className="notice error">{p.error}</div>}{error?<div className="notice error">Messages could not be loaded.</div>:!data?.length?<div className="empty-state"><h2>No contact messages yet.</h2></div>:<div className="admin-list">{data.map((x:any)=><article className="admin-card" key={x.id}><div className="admin-heading"><div><p className="eyebrow">{x.category.replaceAll('_',' ')}</p><h2>{x.subject}</h2><p><strong>{x.name}</strong> · <a href={'mailto:'+x.email}>{x.email}</a></p><small>{new Date(x.created_at).toLocaleString()} · {x.status}</small></div><form action={updateStatus}><input type="hidden" name="id" value={x.id}/><select name="status" defaultValue={x.status}><option value="new">New</option><option value="reviewing">Reviewing</option><option value="resolved">Resolved</option></select><button type="submit">Update</button></form></div><p style={{whiteSpace:'pre-wrap'}}>{x.message}</p></article>)}</div>}</section></main>
}
