import test from 'node:test'
import assert from 'node:assert/strict'
// @ts-expect-error JavaScript deployment validator intentionally has no generated declaration file.
import {validateProductionEnv} from '../scripts/check-production-env.mjs'

const validEnv={
 SUPABASE_SERVICE_ROLE_KEY:'service-secret',
 RESEND_API_KEY:'resend-secret',
 RESEND_WEBHOOK_SECRET:'webhook-secret',
 EMAIL_WORKER_SECRET:'worker-secret',
 RESEND_FROM_EMAIL:'ScentMarked <hello@scentmarked.com>',
 NEXT_PUBLIC_SUPABASE_URL:'https://example.supabase.co',
 NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:'sb_publishable_example',
 NEXT_PUBLIC_SITE_URL:'https://scentmarked.com'
}

test('production env accepts complete HTTPS origin configuration',()=>{
 assert.deepEqual(validateProductionEnv(validEnv),[])
})

test('production env reports missing server secrets',()=>{
 const env={...validEnv,RESEND_API_KEY:'',EMAIL_WORKER_SECRET:''}
 const problems=validateProductionEnv(env)
 assert.ok(problems.some((x:string)=>x.includes('RESEND_API_KEY')))
 assert.ok(problems.some((x:string)=>x.includes('EMAIL_WORKER_SECRET')))
})

test('production env rejects non-HTTPS public URLs',()=>{
 const env={...validEnv,NEXT_PUBLIC_SUPABASE_URL:'http://example.supabase.co',NEXT_PUBLIC_SITE_URL:'http://scentmarked.com'}
 const problems=validateProductionEnv(env)
 assert.ok(problems.includes('NEXT_PUBLIC_SUPABASE_URL must use HTTPS.'))
 assert.ok(problems.includes('NEXT_PUBLIC_SITE_URL must use HTTPS.'))
})

test('production env requires site origin without path, query, or fragment',()=>{
 const env={...validEnv,NEXT_PUBLIC_SITE_URL:'https://scentmarked.com/app?preview=1#top'}
 const problems=validateProductionEnv(env)
 assert.ok(problems.includes('NEXT_PUBLIC_SITE_URL must be an origin only, with no path, query, or fragment.'))
})


test('production env allows public Supabase values to come from Wrangler',()=>{
 const env={...validEnv}
 delete (env as Partial<typeof validEnv>).NEXT_PUBLIC_SUPABASE_URL
 delete (env as Partial<typeof validEnv>).NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
 assert.deepEqual(validateProductionEnv(env),[])
})

test('production env rejects the CI publishable-key placeholder when supplied',()=>{
 const env={...validEnv,NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:'sb_publishable_ci_placeholder'}
 const problems=validateProductionEnv(env)
 assert.ok(problems.includes('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY cannot use the CI placeholder in production.'))
})
