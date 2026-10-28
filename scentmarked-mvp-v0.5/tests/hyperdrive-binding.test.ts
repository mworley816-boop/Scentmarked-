import test from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {fileURLToPath} from 'node:url'
import {dirname,resolve} from 'node:path'

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..')
const id='12fd0f6d7e824d81a40a3f394c4383b4'
const files=[resolve(root,'wrangler.jsonc'),resolve(root,'../wrangler.jsonc')]

test('both Scentmarked Wrangler configs bind the intended Hyperdrive',()=>{
 for(const path of files){
  const config=readFileSync(path,'utf8')
  assert.match(config,/"binding"\s*:\s*"HYPERDRIVE"/)
  assert.ok(config.includes(`"id": "${id}"`),`Hyperdrive ID mismatch in ${path}`)
 }
})

test('Wrangler configs do not embed database passwords or connection strings',()=>{
 for(const path of files){
  const config=readFileSync(path,'utf8')
  assert.doesNotMatch(config,/postgres(?:ql)?:\/\//i)
  assert.doesNotMatch(config,/"(?:password|connectionString)"\s*:/i)
 }
})
