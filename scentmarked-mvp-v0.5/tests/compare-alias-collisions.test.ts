import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const page=readFileSync(join(process.cwd(),'app/compare/page.tsx'),'utf8')

test('comparison aliases do not silently overwrite conflicting slugs',()=>{
 assert.match(page,/const previous=aliasSlugMap\.get\(key\)/)
 assert.match(page,/previous!==canonical\.slug\)aliasSlugMap\.set\(key,null\)/)
})

test('ambiguous aliases cannot fall back to their original slug',()=>{
 assert.match(page,/aliasSlugMap\.has\(slug\)\?aliasSlugMap\.get\(slug\):slug/)
})

test('comparison picker continues to use canonical perfume identifiers',()=>{
 assert.match(page,/selectedSlug=\{a\?\.slug\}/)
 assert.match(page,/selectedSlug=\{b\?\.slug\}/)
})

test('ambiguous aliases use an explicit null marker',()=>{
 assert.match(page,/new Map<string,string\|null>\(\)/)
})
