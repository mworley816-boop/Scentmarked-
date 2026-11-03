import Link from 'next/link'
import {redirect} from 'next/navigation'
import {createClient} from '@/lib/supabase/server'

export const dynamic='force-dynamic'
export const metadata={title:'Atlas Employee Work Queue',robots:{index:false,follow:false}}

type Perfume={id:string;name:string;status:string;image_url:string|null;description:string|null;brands:{name:string}|{name:string}[]|null;perfume_notes:{note_id:string}[]|null;perfume_sources:{id:string}[]|null;perfume_image_provenance:{perfume_id:string}[]|null}
type Work={perfume:Perfume;tasks:string[];priority:number}
export default async function AtlasEmployeeQueue(){
 const s=await createClient()
 const {data:{user},error:authError}=await s.auth.getUser()
 if(authError||!user)redirect('/login?next=/admin/atlas-employees')
 const {data:profile,error:profileError}=await s.from('profiles').select('is_admin').eq('id',user.id).maybeSingle()
 if(profileError||profile?.is_admin!==true)redirect('/discover')
 const rows:Perfume[]=[]
 let loadError=false
 for(let start=0;start<20000;start+=200){
  const {data,error}=await s.from('perfumes').select('id,name,status,image_url,description,brands(name),perfume_notes(note_id),perfume_sources(id),perfume_image_provenance(perfume_id)').order('id').range(start,start+199)
  if(error||!data){loadError=true;break}
  rows.push(...(data as unknown as Perfume[]))
  if(data.length<200)break
  if(start+200>=20000)loadError=true
 }
 const work:Work[]=rows.filter(p=>p.status!=='archived').map(perfume=>{
  const tasks:string[]=[]
  if(!perfume.description?.trim())tasks.push('Research description')
  if(!perfume.perfume_notes?.length)tasks.push('Verify fragrance notes')
  if(!perfume.perfume_sources?.length)tasks.push('Find source evidence')
  if(!perfume.image_url)tasks.push('Research authentic product image')
  else if(!perfume.perfume_image_provenance?.length)tasks.push('Verify image rights')
  return {perfume,tasks,priority:tasks.length}
 }).filter(x=>x.priority>0).sort((a,b)=>b.priority-a.priority||a.perfume.name.localeCompare(b.perfume.name))
 const counts={research:work.filter(w=>w.tasks.some(t=>t.startsWith('Research')||t.startsWith('Verify fragrance')||t.startsWith('Find source'))).length,graphics:work.filter(w=>w.tasks.some(t=>t.includes('image'))).length}
 return <main className="container" style={{paddingBlock:'2rem'}}>
  <Link href="/admin">← Admin Studio</Link>
  <h1>Atlas employee work queue</h1>
  <p>This is a read-only, prioritized inventory of catalog work. It does not start background workers, fetch images, change records, or publish anything.</p>
  {loadError?<p role="alert">Catalog inventory could not be loaded completely. No coverage totals are shown.</p>:<>
   <p><strong>{rows.length}</strong> catalog records · <strong>{work.length}</strong> needing enrichment · <strong>{counts.research}</strong> needing research or source verification · <strong>{counts.graphics}</strong> needing image research or rights verification.</p>
   <p>Archived records are excluded. Every product graphic requires your explicit approval before placement. Research evidence does not automatically count as verified.</p>
   <h2>Highest priority assignments</h2>
   {!work.length?<p>No missing fields found in the checked catalog fields.</p>:<ol>{work.slice(0,100).map(({perfume,tasks})=>{
    const brand=Array.isArray(perfume.brands)?perfume.brands[0]?.name:perfume.brands?.name
    return <li key={perfume.id} style={{marginBlock:'1rem'}}><strong>{brand||'Unknown brand'} — {perfume.name}</strong> ({perfume.status})<div>{tasks.join(' · ')}</div><Link href={'/admin/perfumes/'+encodeURIComponent(perfume.id)+'/edit'}>Review fragrance</Link></li>
   })}</ol>}
   {work.length>100&&<p>Showing the top 100 assignments. Totals include all fetched records.</p>}
  </>}
 </main>
}
