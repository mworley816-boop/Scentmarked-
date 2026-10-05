import {resolve} from 'node:path'
import {pathToFileURL} from 'node:url'

export function validateProductionEnv(env=process.env){
 const publicUrl=(env.NEXT_PUBLIC_SUPABASE_URL||'').trim()
 const publicKey=(env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY||'').trim()
 const siteUrl=(env.NEXT_PUBLIC_SITE_URL||'').trim()

 const problems=[]
if(publicUrl){
  try{
    const url=new URL(publicUrl)
    if(url.protocol!=='https:')problems.push('NEXT_PUBLIC_SUPABASE_URL must use HTTPS.')
  }catch{problems.push('NEXT_PUBLIC_SUPABASE_URL must be a valid URL.')}
}
if(publicKey&&publicKey==='sb_publishable_ci_placeholder')problems.push('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY cannot use the CI placeholder in production.')
if(siteUrl){
  try{
    const url=new URL(siteUrl)
    if(url.protocol!=='https:')problems.push('NEXT_PUBLIC_SITE_URL must use HTTPS.')
    if(url.hostname==='example.com'||url.hostname.endsWith('.example.com'))problems.push('NEXT_PUBLIC_SITE_URL cannot use an example.com placeholder in production.')
    if(url.pathname!=='/'||url.search||url.hash)problems.push('NEXT_PUBLIC_SITE_URL must be an origin only, with no path, query, or fragment.')
  }catch{problems.push('NEXT_PUBLIC_SITE_URL must be a valid URL.')}
}

 return problems
}

const isDirectRun=Boolean(process.argv[1])&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href

if(isDirectRun){
 const problems=validateProductionEnv()
 if(problems.length){
  console.error('ScentMarked production configuration is not ready:')
  for(const problem of problems)console.error('- '+problem)
  process.exit(1)
 }
 console.log('ScentMarked production configuration check passed.')
}
