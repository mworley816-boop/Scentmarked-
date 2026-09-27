import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export default async function Admin(){
 const s=await createClient();
 let user:any=null;
 try{const auth=await s.auth.getUser();user=auth.data.user}catch{}
 if(!user)redirect('/login?next=/admin');
 let isAdmin=false;
 try{const result=await s.from('profiles').select('is_admin').eq('id',user.id).maybeSingle();isAdmin=result.data?.is_admin===true}catch{}
 if(!isAdmin)redirect('/discover');
 return <main><section><p className="eyebrow">SCENTMARKED STUDIO</p><h1 className="page-title">Admin Dashboard</h1><div className="grid"><div className="card"><h3>Add a fragrance</h3><p>Create a perfume record and publish it to discovery.</p><Link className="button" href="/admin/perfumes/new">Add Fragrance</Link></div><div className="card"><h3>Catalog workflow</h3><p>Draft → add notes and accords → verify relationships → publish.</p></div></div></section></main>
}
