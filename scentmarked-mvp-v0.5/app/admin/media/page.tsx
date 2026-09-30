import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export const dynamic='force-dynamic'
export const metadata={title:'Media Library | ScentMarked Studio',robots:{index:false,follow:false}}

async function admin(){
 const s=await createClient()
 const {data:{user}}=await s.auth.getUser()
 if(!user)redirect('/login?next=/admin/media')
 const {data}=await s.from('profiles').select('is_admin').eq('id',user.id).maybeSingle()
 if(data?.is_admin!==true)redirect('/discover')
 return s
}

export default async function MediaLibrary(){
 const s=await admin()
 const {data,error}=await s.storage.from('site-media').list('content',{limit:100,sortBy:{column:'created_at',order:'desc'}})
 const files=(data||[]).filter((file:any)=>file.name&&file.name!=='.emptyFolderPlaceholder')
 return <main><section className="admin-catalog">
  <p className="eyebrow">SCENTMARKED STUDIO</p>
  <div className="admin-heading"><div><h1 className="page-title">Media Library</h1><p>Reusable backgrounds, banners, hero images and promotional artwork.</p></div><div className="result-actions"><Link className="button ghost" href="/admin">Catalog Studio</Link><Link className="button" href="/admin/site-content">Site Content</Link></div></div>
  {error&&<p className="notice error">{error.message}</p>}
  {!files.length?<div className="admin-card"><h2>No site media yet</h2><p>Upload your first image from Site Content. It will appear here automatically.</p><Link className="button" href="/admin/site-content">Upload Site Artwork</Link></div>:
  <div className="admin-card"><h2>{files.length} media {files.length===1?'file':'files'}</h2><div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))',gap:18}}>
   {files.map((file:any)=>{
    const path='content/'+file.name
    const url=s.storage.from('site-media').getPublicUrl(path).data.publicUrl
    return <article key={file.id||file.name} className="admin-row" style={{display:'block'}}>
     <img src={url} alt="" style={{width:'100%',height:160,objectFit:'cover',borderRadius:12,marginBottom:10}}/>
     <b style={{display:'block',overflowWrap:'anywhere'}}>{file.name}</b>
     <p>{file.metadata?.size?Math.round(file.metadata.size/1024)+' KB':'Site media'}</p>
     <a className="button ghost" href={url} target="_blank" rel="noreferrer">Open Image</a>
    </article>
   })}</div></div>}
 </section></main>
}
