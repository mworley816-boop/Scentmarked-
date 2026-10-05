const required=[
  'SUPABASE_SERVICE_ROLE_KEY',
  'RESEND_API_KEY',
  'RESEND_WEBHOOK_SECRET',
  'EMAIL_WORKER_SECRET',
  'RESEND_FROM_EMAIL'
]

const missing=required.filter(name=>!(process.env[name]||'').trim())
const publicUrl=(process.env.NEXT_PUBLIC_SUPABASE_URL||'').trim()
const publicKey=(process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY||'').trim()
const siteUrl=(process.env.NEXT_PUBLIC_SITE_URL||'').trim()

const problems=[]
if(missing.length)problems.push('Missing server configuration: '+missing.join(', '))
if(!publicUrl)problems.push('NEXT_PUBLIC_SUPABASE_URL is missing.')
else{
  try{
    const url=new URL(publicUrl)
    if(url.protocol!=='https:')problems.push('NEXT_PUBLIC_SUPABASE_URL must use HTTPS.')
  }catch{problems.push('NEXT_PUBLIC_SUPABASE_URL must be a valid URL.')}
}
if(!publicKey)problems.push('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY is missing.')
if(!siteUrl)problems.push('NEXT_PUBLIC_SITE_URL is missing. Set the final production origin before launch.')
else{
  try{
    const url=new URL(siteUrl)
    if(url.protocol!=='https:')problems.push('NEXT_PUBLIC_SITE_URL must use HTTPS.')
    if(url.pathname!=='/'||url.search||url.hash)problems.push('NEXT_PUBLIC_SITE_URL must be an origin only, with no path, query, or fragment.')
  }catch{problems.push('NEXT_PUBLIC_SITE_URL must be a valid URL.')}
}

if(problems.length){
  console.error('ScentMarked production configuration is not ready:')
  for(const problem of problems)console.error('- '+problem)
  process.exit(1)
}

console.log('ScentMarked production configuration check passed.')
