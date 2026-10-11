import test from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {join} from 'node:path'

const worker=readFileSync(join(process.cwd(),'app/api/internal/email-worker/route.ts'),'utf8')

test('email worker distinguishes uncertain delivery outcomes from routine failures',()=>{
  assert.match(worker,/error instanceof EmailDeliveryPersistenceError/)
  assert.match(worker,/error instanceof EmailProviderConfirmationError/)
  assert.match(worker,/reconciliationRequired,error:reconciliationRequired/)
  assert.match(worker,/manual reconciliation required/)
})

test('worker summary surfaces reconciliation state and logs affected campaign IDs',()=>{
  assert.match(worker,/results\.some\(result=>result\.reconciliationRequired===true\)/)
  assert.match(worker,/const summary=\{ok:failures===0,processed:results\.length,failures,reconciliationRequired/)
  assert.match(worker,/console\.error\('Email delivery reconciliation required'/)
  assert.match(worker,/results\.filter\(result=>result\.reconciliationRequired===true\)\.map\(result=>result\.campaignId\)/)
})

test('worker returns non-success response when campaign processing fails',()=>{
  assert.match(worker,/if\(failures>0\)return NextResponse\.json\(summary,\{status:500\}\)/)
})

test('worker logs categorized errors without raw exception messages',()=>{
  assert.match(worker,/errorType:error instanceof EmailDeliveryPersistenceError/)
  assert.match(worker,/provider_confirmation/)
  assert.match(worker,/processing_failure/)
  assert.doesNotMatch(worker,/error:error instanceof Error\?error\.message/)
})

test('uncertain delivery outcomes return conflict before routine server errors',()=>{
  const conflict=worker.indexOf("if(reconciliationRequired)return NextResponse.json(summary,{status:409})")
  const failure=worker.indexOf("if(failures>0)return NextResponse.json(summary,{status:500})")
  assert.ok(conflict>=0,'worker must return 409 for reconciliation')
  assert.ok(failure>conflict,'409 reconciliation response must take precedence over 500')
})

test('delivery claims do not automatically recycle uncertain processing rows',()=>{
  const migration=readFileSync(join(process.cwd(),'supabase/migrations/20261011010000_prevent_uncertain_email_delivery_reclaims.sql'),'utf8')
  assert.match(migration,/create or replace function public\.claim_email_delivery_batch/)
  assert.match(migration,/status='queued'/)
  assert.doesNotMatch(migration,/processing_started_at\s*<\s*now\(\)/)
  assert.doesNotMatch(migration,/set status='queued'/)
})

test('campaign reconciliation view is read-only and shows processing delivery identifiers',()=>{
  const page=readFileSync(join(process.cwd(),'app/admin/email/[id]/page.tsx'),'utf8')
  assert.match(page,/\.select\('id,processing_started_at,provider_message_id'\)/)
  assert.match(page,/\.eq\('campaign_id',id\)\.eq\('status','processing'\)/)
  assert.match(page,/\.limit\(50\)/)
  assert.match(page,/Processing delivery details could not be loaded/)
  assert.match(page,/Showing the oldest/)
  const section=page.slice(page.indexOf('RECONCILIATION DETAILS'),page.indexOf('CAMPAIGN ANALYTICS'))
  assert.ok(section.includes('Processing delivery IDs'))
  assert.doesNotMatch(section,/formAction=|<form|\.update\(|\.rpc\(/)
})

test('reconciliation view does not mistake missing provider IDs for unsent mail',()=>{
  const page=readFileSync(join(process.cwd(),'app/admin/email/[id]/page.tsx'),'utf8')
  assert.match(page,/processingWithProviderId=processingList\.filter/)
  assert.match(page,/missing IDs do not prove that an email was not sent/)
  assert.match(page,/provider_message_id\|\|'Not recorded'/)
})

test('campaign delivery analytics use exact counts instead of a capped status row fetch',()=>{
  const page=readFileSync(join(process.cwd(),'app/admin/email/[id]/page.tsx'),'utf8')
  assert.match(page,/deliveryStatuses\.map\(status=>s\.from\('email_deliveries'\)\.select\('id',\{count:'exact',head:true\}\)/)
  assert.match(page,/const \{count:deliveryTotal,error:deliveryTotalError\}/)
  assert.match(page,/Delivery analytics could not be fully loaded/)
  assert.doesNotMatch(page,/\.select\('status'\)\.eq\('campaign_id',id\)/)
  assert.doesNotMatch(page,/const total=rows\.length/)
})

test('campaign analytics report missing count responses as incomplete',()=>{
  const page=readFileSync(join(process.cwd(),'app/admin/email/[id]/page.tsx'),'utf8')
  assert.match(page,/deliveryCountResults\.some\(result=>result\.error!==null\|\|result\.count===null\)/)
  assert.match(page,/processingListTruncated=!deliveryCountsError/)
})
