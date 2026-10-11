import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {join} from 'node:path'
import test from 'node:test'

const adminPage=readFileSync(join(process.cwd(),'app','admin','crm','page.tsx'),'utf8')
const detailPage=readFileSync(join(process.cwd(),'app','admin','crm','[id]','page.tsx'),'utf8')

for(const [label,source] of [['contacts list',adminPage],['contact detail',detailPage]] as const){
  test(label+' status forms carry the original row version',()=>{
    assert.match(source,/name="expected_status" value=\{c\.status\}/)
    assert.match(source,/name="expected_updated_at" value=\{c\.updated_at\}/)
    assert.match(source,/String\(formData\.get\('expected_status'\)\|\|''\)/)
    assert.match(source,/String\(formData\.get\('expected_updated_at'\)\|\|''\)/)
  })
  test(label+' status changes require unchanged database version',()=>{
    assert.match(source,/contact\.updated_at!==expectedUpdatedAt|existing\.updated_at!==expectedUpdatedAt/)
    assert.match(source,/\.eq\('status',(?:expectedStatus|existing\.status)\)/)
    assert.match(source,/\.eq\('updated_at',(?:expectedUpdatedAt|existing\.updated_at)\)/)
    assert.match(source,/data\.length!==1/)
  })
  test(label+' blocks direct reactivation after unsubscribe',()=>{
    assert.match(source,/unsubscribed_at/)
    assert.match(source,/status==='active'/)
    assert.match(source,/consent workflow|renewed consent/)
  })
}

test('both CRM admin status actions verify unsubscribe normalization',()=>{
  for(const [label,source] of [['contacts list',adminPage],['contact detail',detailPage]] as const){
    assert.match(source,/if\(status==='unsubscribed'\)/,label)
    assert.match(source,/select\('marketing_consent,unsubscribed_at'\)/,label)
    assert.match(source,/verified\.marketing_consent!==false/,label)
    assert.match(source,/!verified\.unsubscribed_at/,label)
  }
})
