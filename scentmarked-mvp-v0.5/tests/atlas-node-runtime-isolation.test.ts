import test from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync,readdirSync} from 'node:fs'
import {join} from 'node:path'

/** The pinned transport uses Node HTTPS/DNS APIs that must never be bundled
 * into Cloudflare route handlers without a separately audited runtime.
 */
function sourceFiles(root:string):string[]{
 return readdirSync(root,{withFileTypes:true}).flatMap(entry=>{
  const path=join(root,entry.name)
  if(entry.isDirectory())return sourceFiles(path)
  return /\.(ts|tsx)$/.test(entry.name)?[path]:[]
 })
}

test('Cloudflare app and route files do not import the Node-only Atlas transport',()=>{
 for(const path of sourceFiles(join(process.cwd(),'app'))){
  const content=readFileSync(path,'utf8')
  assert.doesNotMatch(content,/atlas-pinned-node-transport/,path+' must not import Node-only transport')
 }
})

test('Node-only Atlas transport is not imported by shared Atlas automation modules',()=>{
 for(const path of sourceFiles(join(process.cwd(),'lib'))){
  if(path.endsWith('atlas-pinned-node-transport.ts'))continue
  const content=readFileSync(path,'utf8')
  assert.doesNotMatch(content,/from\s*['"][^'"]*atlas-pinned-node-transport(?:\.ts)?['"]/,path+' must not import Node-only transport')
 }
})
