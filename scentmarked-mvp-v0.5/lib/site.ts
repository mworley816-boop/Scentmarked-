const FALLBACK_SITE_URL='https://scentmarked.m-worley816.workers.dev'

export function getSiteUrl(){
 const configured=(process.env.NEXT_PUBLIC_SITE_URL||'').trim()
 try{
  const url=new URL(configured||FALLBACK_SITE_URL)
  // A production email must never send members to a developer's localhost.
  // Keep localhost available for local development and tests.
  if(process.env.NODE_ENV==='production'&&
     (url.hostname==='localhost'||url.hostname==='127.0.0.1'||url.hostname==='0.0.0.0'||url.protocol!=='https:')){
   return FALLBACK_SITE_URL
  }
  return url.origin
 }catch{return FALLBACK_SITE_URL}
}

export const siteUrl=getSiteUrl()
