/** Conservative extraction of manufacturer page metadata.
 * All output is untrusted and requires source review before catalog publication.
 */
export type AtlasPageMetadata={title:string;description:string|null;canonicalUrl:string|null}
function decodeEntities(s:string):string{
 return s.replace(/&(?:amp|lt|gt|quot|apos|#39|nbsp);/gi,x=>({'&amp;':'&','&lt;':'<','&gt;':'>','&quot;':'"','&apos;':"'",'&#39;':"'",'&nbsp;':' '}[x.toLowerCase()]??x))
}
function clean(s:string):string{return decodeEntities(s.replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim()).slice(0,300)}
function attr(tag:string,key:string):string|null{
 const escaped=key.replace(/[.*+?^$()|[\]{}]/g,'\\$&')
 const m=tag.match(new RegExp('(?:^|\\s)'+escaped+'\\s*=\\s*(?:"([^"]*)"|\x27([^\x27]*)\x27|([^\\s>]+))','i'))
 return m?(m[1]??m[2]??m[3]):null
}
export function extractAtlasPageMetadata(html:string,pageUrl:string):AtlasPageMetadata{
 const title=clean(html.match(/<title\b[^>]*>([\s\S]*?)<\/title\s*>/i)?.[1]??'')
 let description:string|null=null,canonicalUrl:string|null=null
 for(const tag of html.match(/<meta\b[^>]*>/gi)??[]){
  const name=(attr(tag,'name')??attr(tag,'property')??'').toLowerCase()
  if((name==='description'||name==='og:description')&&!description){
   const value=clean(attr(tag,'content')??'')
   if(value)description=value
  }
 }
 for(const tag of html.match(/<link\b[^>]*>/gi)??[]){
  if((attr(tag,'rel')??'').toLowerCase().split(/\s+/).includes('canonical')){
   try{const url=new URL(attr(tag,'href')??'',pageUrl);if(url.protocol==='https:'&&url.hostname===new URL(pageUrl).hostname)canonicalUrl=url.href}catch{}
   break
  }
 }
 return {title,description,canonicalUrl}
}
