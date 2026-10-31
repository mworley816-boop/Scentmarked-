import test from 'node:test'
import assert from 'node:assert/strict'
import {spawnSync} from 'node:child_process'
import {mkdtempSync,readdirSync,rmSync} from 'node:fs'
import {tmpdir} from 'node:os'
import {join,resolve} from 'node:path'

const script=resolve('scripts/atlas-manufacturer-research-dry-run.ts')
function run(env:Record<string,string>){
 const cwd=mkdtempSync(join(tmpdir(),'atlas-dry-run-'))
 try{
  const result=spawnSync(process.execPath,['--experimental-strip-types',script],{
   cwd,env:{...process.env,ATLAS_BRAND:'Arabiyat',ATLAS_PERFUME_NAME:'Test perfume',ATLAS_SOURCE_URL:'https://unapproved.example.com/product',...env},
   encoding:'utf8',timeout:15000
  })
  return {status:result.status,stderr:result.stderr,files:readdirSync(cwd)}
 }finally{rmSync(cwd,{recursive:true,force:true})}
}

test('unapproved manufacturer fails closed without creating research artifact',()=>{
 const result=run({})
 assert.equal(result.status,1)
 assert.match(result.stderr,/not reviewed|not been reviewed/i)
 assert.deepEqual(result.files,[])
})

test('invalid research URL fails without creating research artifact',()=>{
 const result=run({ATLAS_SOURCE_URL:'http://unapproved.example.com/product'})
 assert.equal(result.status,1)
 assert.match(result.stderr,/not reviewed|HTTPS/i)
 assert.deepEqual(result.files,[])
})

test('missing perfume name fails without creating research artifact',()=>{
 const result=run({ATLAS_PERFUME_NAME:''})
 assert.equal(result.status,1)
 assert.match(result.stderr,/required/i)
 assert.deepEqual(result.files,[])
})
