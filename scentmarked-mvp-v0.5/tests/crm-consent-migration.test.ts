import assert from 'node:assert/strict'
import {readFileSync,readdirSync} from 'node:fs'
import {join} from 'node:path'
import test from 'node:test'

const migrationsDir=join(process.cwd(),'supabase','migrations')
const guardMigration='20261011000000_prevent_crm_status_only_unsubscribe_reactivation.sql'

test('CRM consent migration prevents status-only reactivation',()=>{
  const sql=readFileSync(join(migrationsDir,guardMigration),'utf8')
  assert.match(sql,/old\.status\s*=\s*'unsubscribed'/i)
  assert.match(sql,/new\.status\s*=\s*'active'/i)
  assert.match(sql,/old\.marketing_consent\s+is\s+distinct\s+from\s+true/i)
  assert.match(sql,/new\.marketing_consent\s+is\s+true/i)
  assert.match(sql,/raise exception 'Unsubscribed contact requires renewed marketing consent'/i)
})
test('CRM consent migration retains explicit renewed consent and unsubscribe normalization',()=>{
  const sql=readFileSync(join(migrationsDir,guardMigration),'utf8')
  assert.match(sql,/new\.marketing_consented_at\s*:=\s*now\(\)/i)
  assert.match(sql,/new\.unsubscribed_at\s*:=\s*null/i)
  assert.match(sql,/if new\.status='unsubscribed' then new\.status:='active'/i)
  assert.match(sql,/if new\.status='unsubscribed' then\s*new\.marketing_consent:=false/i)
  assert.match(sql,/new\.unsubscribed_at:=coalesce\(new\.unsubscribed_at,now\(\)\)/i)
})
test('CRM guard migration is ordered after initial CRM schema',()=>{
  const migrations=readdirSync(migrationsDir)
  assert.ok(migrations.includes(guardMigration))
  assert.ok(guardMigration>'20261004010045_crm_email_production.sql')
})
