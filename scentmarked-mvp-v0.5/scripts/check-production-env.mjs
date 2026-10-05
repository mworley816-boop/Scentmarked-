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
if(!siteUrl)problems.push('NEXT_PUBLIC_SITE_URL is missing. Set the final production origin before launch.')
else{
  try{
    const url=new URL(siteUrl)
    if(url.protocol!=='https:')problems.push('NEXT_PUBLIC_SITE_URL must use HTTPS.')
    if(url.pathname!=='/'||url.search||url.hash)problems.push('NEXT_PUBLIC_SITE_URL must be an origin only, with no path, query, or fragment.')
  }catch{problems.push('NEXT_PUBLIC_SITE_URL must be a valid URL.')}
}

 return problems
}

if(import.meta.url===new URL(process.argv[1], 'file:').href){
 const problems=validateProductionEnv()
 if(problems.length){
  console.error('ScentMarked production configuration is not ready:')
  for(const problem of problems)console.error('- '+problem)
  process.exit(1)
 }
 console.log('ScentMarked production configuration check passed.')
}
