import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {join} from 'node:path'
import test from 'node:test'

const source=readFileSync(join(process.cwd(),'lib','email-queue.ts'),'utf8')

for(const [label,dataName,errorName] of [
  ['sent','updated','updateError'],
  ['skipped','skippedRow','skipError'],
  ['failed','failedRow','failureUpdateError']
] as const){
  test(label+' delivery requires confirmation of exactly one matching row',()=>{
    assert.match(source,new RegExp('data:'+dataName+',error:'+errorName))
    assert.match(source,new RegExp('!Array\\.isArray\\('+dataName+'\\)\\|\\|'+dataName+'\\.length!==1\\|\\|'+dataName+'\\[0\\]\\?\\.id!==row\\.id'))
  })
}

test('accepted provider emails raise a reconciliation error if persistence fails',()=>{
  assert.match(source,/throw new EmailDeliveryPersistenceError\(\)/)
  assert.match(source,/if\(error instanceof EmailDeliveryPersistenceError\|\|error instanceof EmailProviderConfirmationError\)throw error/)
})
