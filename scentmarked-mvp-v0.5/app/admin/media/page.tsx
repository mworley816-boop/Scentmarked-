import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import MediaBulkSelect from '@/components/media-bulk-select'

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

async function uploadMedia(formData:FormData){'use server';const s=await admin(),file=formData.get('image');if(!(file instanceof File)||file.size===0)redirect('/admin/media?error='+encodeURIComponent('Choose an image to upload.'));const allowed=['image/jpeg','image/png','image/webp','image/avif'];if(!allowed.includes(file.type))redirect('/admin/media?error='+encodeURIComponent('Use a JPEG, PNG, WebP, or AVIF image.'));if(file.size>5242880)redirect('/admin/media?error='+encodeURIComponent('Image must be 5 MB or smaller.'));const ext:Record<string,string>={'image/jpeg':'jpg','image/png':'png','image/webp':'webp','image/avif':'avif'},safe=file.name.replace(/\.[^.]+$/,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'').slice(0,60)||'site-media',path='content/'+Date.now().toString(36)+'-'+safe+'.'+ext[file.type];const {error}=await s.storage.from('site-media').upload(path,file,{contentType:file.type,upsert:false});if(error)redirect('/admin/media?error='+encodeURIComponent(error.message));redirect('/admin/media?uploaded=1')}

async function removeMedia(formData:FormData){'use server';const s=await admin(),path=String(formData.get('path')||'');if(!path)redirect('/admin/media?error='+encodeURIComponent('Missing media path.'));const url=s.storage.from('site-media').getPublicUrl(path).data.publicUrl;const [{data:refs},{data:brandRefs},{data:perfumeRefs},{data:noteRefs},{data:provenanceRefs}]=await Promise.all([s.from('site_content').select('id').or('image_url.eq.'+url+',mobile_image_url.eq.'+url).limit(1),s.from('brands').select('id,name').or('logo_url.eq.'+url+',banner_url.eq.'+url).limit(1),s.from('perfumes').select('id,name').eq('image_url',url).limit(1),s.from('notes').select('id,name').eq('image_url',url).limit(1),s.from('perfume_image_provenance').select('perfume_id').eq('asset_url',url).limit(1)]);if(refs?.length)redirect('/admin/media?error='+encodeURIComponent('This image is still used by Site Content. Remove it there first.'));if(brandRefs?.length)redirect('/admin/media?error='+encodeURIComponent('This image is still used by '+(brandRefs[0] as any).name+' in Brand Studio. Remove it there first.'));if(perfumeRefs?.length)redirect('/admin/media?error='+encodeURIComponent('This image is still used by '+(perfumeRefs[0] as any).name+'. Remove it from the fragrance first.'));if(noteRefs?.length)redirect('/admin/media?error='+encodeURIComponent('This image is still used by the '+(noteRefs[0] as any).name+' note. Remove it from the note first.'));if(provenanceRefs?.length)redirect('/admin/media?error='+encodeURIComponent('This image is still referenced by a fragrance image-rights record. Remove or replace that provenance record first.'));const {error}=await s.storage.from('site-media').remove([path]);if(error)redirect('/admin/media?error='+encodeURIComponent(error.message));redirect('/admin/media?deleted=1')}


async function removeSelectedUnused(formData:FormData){'use server'
 const s=await admin(),paths=formData.getAll('paths').map(String).filter((x)=>x.startsWith('content/')&&!x.includes('..')).slice(0,100)
 if(!paths.length)redirect('/admin/media?view=unused&error='+encodeURIComponent('Select at least one unused image.'))
 const urls=paths.map((path)=>s.storage.from('site-media').getPublicUrl(path).data.publicUrl)
 const [{data:site},{data:brands},{data:perfumes},{data:notes},{data:provenance}]=await Promise.all([
  s.from('site_content').select('image_url,mobile_image_url'),
  s.from('brands').select('logo_url,banner_url'),
  s.from('perfumes').select('image_url'),
  s.from('notes').select('image_url'),
  s.from('perfume_image_provenance').select('asset_url')
 ])
 const used=new Set<string>()
 ;(site||[]).forEach((x:any)=>{if(x.image_url)used.add(x.image_url);if(x.mobile_image_url)used.add(x.mobile_image_url)})
 ;(brands||[]).forEach((x:any)=>{if(x.logo_url)used.add(x.logo_url);if(x.banner_url)used.add(x.banner_url)})
 ;(perfumes||[]).forEach((x:any)=>{if(x.image_url)used.add(x.image_url)})
 ;(notes||[]).forEach((x:any)=>{if(x.image_url)used.add(x.image_url)})
 ;(provenance||[]).forEach((x:any)=>{if(x.asset_url)used.add(x.asset_url)})
 const safe=paths.filter((_,i)=>!used.has(urls[i])),skipped=paths.length-safe.length
 if(!safe.length)redirect('/admin/media?view=unused&error='+encodeURIComponent('Nothing was deleted. The selected images are now in use.'))
 const {error}=await s.storage.from('site-media').remove(safe)
 if(error)redirect('/admin/media?view=unused&error='+encodeURIComponent(error.message))
 redirect('/admin/media?view=unused&bulkDeleted='+safe.length+(skipped?'&skipped='+skipped:''))
}

export default async function MediaLibrary({searchParams}:{searchParams:Promise<{error?:string;deleted?:string;uploaded?:string;view?:string;page?:string;q?:string;bulkDeleted?:string;skipped?:string}>}){const params=await searchParams;
 const s=await admin()
 const page=Math.max(1,Number.parseInt(params.page||'1',10)||1),pageSize=100
 const {data,error}=await s.storage.from('site-media').list('content',{limit:pageSize,offset:(page-1)*pageSize,sortBy:{column:'created_at',order:'desc'}})
 const files=(data||[]).filter((file:any)=>file.name&&file.name!=='.emptyFolderPlaceholder');const [{data:siteRefs},{data:brandRefs},{data:perfumeRefs},{data:noteRefs},{data:provenanceRefs}]=await Promise.all([s.from('site_content').select('id,content_key,title,image_url,mobile_image_url'),s.from('brands').select('id,name,slug,logo_url,banner_url'),s.from('perfumes').select('id,name,slug,image_url'),s.from('notes').select('id,name,slug,image_url'),s.from('perfume_image_provenance').select('perfume_id,asset_url')]);const contentNames:Record<string,string>={homepage_hero:'Homepage Hero',homepage_banner:'Homepage Banner',discover_banner:'Discover Banner',compare_banner:'Compare Banner',global_background:'Global Site Background',global_brand:'Global Brand',announcement_bar:'Announcement Bar',footer_copy:'Footer Copy',social_image:'Social Share Image',perfume_fallback:'Default Perfume Image',favicon:'Site Icon / Favicon',brand_logo_fallback:'Default Brand Logo',brand_banner_fallback:'Default Brand Banner'};const usage=(url:string)=>{const uses:{label:string;href:string}[]=[];(siteRefs||[]).forEach((x:any)=>{if(x.image_url===url)uses.push({label:(x.title||contentNames[x.content_key]||x.content_key)+' · desktop',href:'/admin/site-content?edit='+x.id});if(x.mobile_image_url===url)uses.push({label:(x.title||contentNames[x.content_key]||x.content_key)+' · mobile',href:'/admin/site-content?edit='+x.id})});(brandRefs||[]).forEach((x:any)=>{if(x.logo_url===url)uses.push({label:x.name+' · logo',href:'/admin/brands?edit='+x.id});if(x.banner_url===url)uses.push({label:x.name+' · banner',href:'/admin/brands?edit='+x.id})});(perfumeRefs||[]).forEach((x:any)=>{if(x.image_url===url)uses.push({label:x.name+' · fragrance image',href:'/admin/perfumes/'+x.id+'/edit'})});(noteRefs||[]).forEach((x:any)=>{if(x.image_url===url)uses.push({label:x.name+' · note image',href:'/note/'+x.slug})});(provenanceRefs||[]).forEach((x:any)=>{if(x.asset_url===url)uses.push({label:'Fragrance image rights record',href:'/admin/perfumes/'+x.perfume_id+'/edit'})});return uses}
 const view=params.view||'all',search=(params.q||'').trim().toLowerCase(),filteredFiles=search?files.filter((file:any)=>file.name.toLowerCase().includes(search)):files,shownFiles=view==='unused'?filteredFiles.filter((file:any)=>{const url=s.storage.from('site-media').getPublicUrl('content/'+file.name).data.publicUrl;return usage(url).length===0}):filteredFiles;return <main><section className="admin-catalog">
  <p className="eyebrow">SCENTMARKED STUDIO</p>
  <div className="admin-heading"><div><h1 className="page-title">Media Library</h1><p>Reusable backgrounds, banners, hero images and promotional artwork.</p></div><div className="result-actions"><Link className="button ghost" href="/admin">Catalog Studio</Link><Link className="button" href="/admin/site-content">Site Content</Link></div></div>
  {(error||params.error)&&<p className="notice error">{params.error||error?.message}</p>}{params.deleted&&<p className="notice">Media deleted.</p>}{params.uploaded&&<p className="notice">Media uploaded and ready to reuse.</p>}{params.bulkDeleted&&<p className="notice">Deleted {params.bulkDeleted} unused media file{params.bulkDeleted==='1'?'':'s'}.{params.skipped?' '+params.skipped+' selected file'+(params.skipped==='1'?' was':'s were')+' kept because '+(params.skipped==='1'?'it is':'they are')+' now in use.':''}</p>}<form action={uploadMedia} className="admin-card"><div className="admin-heading"><div><h2>Upload reusable artwork</h2><p>Add an image directly to the shared Site Content and Brand Studio media library.</p></div><button className="button" type="submit">Upload Media</button></div><input name="image" type="file" accept="image/jpeg,image/png,image/webp,image/avif" required/><p className="muted">JPEG, PNG, WebP or AVIF · maximum 5 MB.</p></form>
  {!files.length?<div className="admin-card"><h2>No site media yet</h2><p>Upload your first reusable image above. It will be available in Site Content and Brand Studio.</p><Link className="button" href="/admin/site-content">Upload Site Artwork</Link></div>:
  <div className="admin-card"><form action="/admin/media" className="admin-filters"><input name="q" defaultValue={params.q||''} placeholder="Search media filename…"/>{view!=='all'&&<input type="hidden" name="view" value={view}/>}<button className="button">Search</button>{search&&<Link href={view==='all'?'/admin/media':'/admin/media?view='+view}>Clear</Link>}</form><div className="admin-heading"><div><h2>{shownFiles.length} media {shownFiles.length===1?'file':'files'} on page {page}</h2><p>{view==='unused'?'Showing unused assets from this storage page. Continue through pages to review the full library.':'Showing reusable site media for this storage page.'}</p></div><div className="result-actions"><Link className={view==='all'?'button':'button ghost'} href="/admin/media">All</Link><Link className={view==='unused'?'button':'button ghost'} href="/admin/media?view=unused">Unused</Link></div></div>{view==='unused'&&shownFiles.length>0&&<div style={{marginBottom:18}}><MediaBulkSelect/><form id="bulk-media-delete-form" action={removeSelectedUnused} className="result-actions" style={{marginTop:10}}><button className="button ghost" type="submit">Delete selected unused</button><span className="muted">Selected files are checked again before deletion.</span></form></div>}<div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))',gap:18}}>
   {shownFiles.map((file:any)=>{
    const path='content/'+file.name
    const url=s.storage.from('site-media').getPublicUrl(path).data.publicUrl,uses=usage(url)
    return <article key={file.id||file.name} className="admin-row" style={{display:'block'}}>
     {view==='unused'&&<label style={{display:'flex',gap:8,alignItems:'center',marginBottom:10}}><input form="bulk-media-delete-form" type="checkbox" name="paths" value={path} data-media-select="unused"/> Select</label>}
     <img src={url} alt="" style={{width:'100%',height:160,objectFit:'cover',borderRadius:12,marginBottom:10}}/>
     <b style={{display:'block',overflowWrap:'anywhere'}}>{file.name}</b>
     <p>{file.metadata?.size?Math.round(file.metadata.size/1024)+' KB':'Site media'} · {uses.length?uses.length+' active use'+(uses.length===1?'':'s'):'Unused'}</p>{uses.length?<div className="profile-tags">{uses.map((use:any,i:number)=><Link key={use.href+i} href={use.href}>{use.label}</Link>)}</div>:<p className="muted">Safe to delete if you no longer need this asset.</p>}
     <div className="result-actions"><a className="button ghost" href={url} target="_blank" rel="noreferrer">Open Image</a><form action={removeMedia}><input type="hidden" name="path" value={path}/><button className="button ghost" type="submit">Delete</button></form></div>
    </article>
   })}</div>{(page>1||files.length===pageSize)&&<div className="result-actions" style={{marginTop:18}}>{page>1&&<Link className="button ghost" href={'/admin/media?'+new URLSearchParams({...(view!=='all'?{view}:{}),...(search?{q:params.q||''}:{}),page:String(page-1)}).toString()}>← Previous</Link>}{files.length===pageSize&&<Link className="button ghost" href={'/admin/media?'+new URLSearchParams({...(view!=='all'?{view}:{}),...(search?{q:params.q||''}:{}),page:String(page+1)}).toString()}>Next →</Link>}</div>}</div>}
 </section></main>
}
