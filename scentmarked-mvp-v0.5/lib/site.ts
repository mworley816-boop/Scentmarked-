const FALLBACK_SITE_URL='https://scentmarked.m-worley816.workers.dev'

export function getSiteUrl(){
 const configured=(process.env.NEXT_PUBLIC_SITE_URL||'').trim()
 const raw=configured||FALLBACK_SITE_URL
 try{return new URL(raw).origin}catch{return FALLBACK_SITE_URL}
}

export const siteUrl=getSiteUrl()
