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

async function removeMedia(formData:FormData){'use server';const s=await admin(),path=String(formData.get('path')||'');if(!path)redirect('/admin/media?error='+encodeURIComponent('Missing media path.'));const url=s.storage.from('site-media').getPublicUrl(path).data.publicUrl;const {data:refs}=await s.from('site_content').select('id').or('image_url.eq.'+url+',mobile_image_url.eq.'+url).limit(1);if(refs?.length)redirect('/admin/media?error='+encodeURIComponent('This image is still used by Site Content. Remove it there first.'));const {error}=await s.storage.from('site-media').remove([path]);if(error)redirect('/admin/media?error='+encodeURIComponent(error.message));redirect('/admin/media?deleted=1')}

export default async function MediaLibrary({searchParams}:{searchParams:Promise<{error?:string;deleted?:string}>}){const params=await searchParams;
 const s=await admin()
 const {data,error}=await s.storage.from('site-media').list('content',{limit:100,sortBy:{column:'created_at',order:'desc'}})
 const files=(data||[]).filter((file:any)=>file.name&&file.name!=='.emptyFolderPlaceholder')
 return <main><section className="admin-catalog">
  <p className="eyebrow">SCENTMARKED STUDIO</p>
  <div className="admin-heading"><div><h1 className="page-title">Media Library</h1><p>Reusable backgrounds, banners, hero images and promotional artwork.</p></div><div className="result-actions"><Link className="button ghost" href="/admin">Catalog Studio</Link><Link className="button" href="/admin/site-content">Site Content</Link></div></div>
  {(error||params.error)&&<p className="notice error">{params.error||error?.message}</p>}{params.deleted&&<p className="notice">Media deleted.</p>}
  {!files.length?<div className="admin-card"><h2>No site media yet</h2><p>Upload your first image from Site Content. It will appear here automatically.</p><Link className="button" href="/admin/site-content">Upload Site Artwork</Link></div>:
  <div className="admin-card"><h2>{files.length} media {files.length===1?'file':'files'}</h2><div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))',gap:18}}>
   {files.map((file:any)=>{
    const path='content/'+file.name
    const url=s.storage.from('site-media').getPublicUrl(path).data.publicUrl
    return <article key={file.id||file.name} className="admin-row" style={{display:'block'}}>
     <img src={url} alt="" style={{width:'100%',height:160,objectFit:'cover',borderRadius:12,marginBottom:10}}/>
     <b style={{display:'block',overflowWrap:'anywhere'}}>{file.name}</b>
     <p>{file.metadata?.size?Math.round(file.metadata.size/1024)+' KB':'Site media'}</p>
     <div className="result-actions"><a className="button ghost" href={url} target="_blank" rel="noreferrer">Open Image</a><form action={removeMedia}><input type="hidden" name="path" value={path}/><button className="button ghost" type="submit">Delete</button></form></div>
    </article>
   })}</div></div>}
 </section></main>
}
