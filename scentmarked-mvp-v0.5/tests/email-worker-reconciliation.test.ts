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
