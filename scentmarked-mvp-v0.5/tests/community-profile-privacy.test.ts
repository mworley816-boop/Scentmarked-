import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const root=fileURLToPath(new URL('../',import.meta.url))
const read=(path:string)=>readFileSync(root+path,'utf8')

for(const path of ['app/community/page.tsx','app/perfume/[slug]/page.tsx']){
 test(`${path} uses the narrow public community identity layer`,()=>{
  const source=read(path)
  assert.match(source,/from\(['"]community_profiles['"]\)/)
  assert.doesNotMatch(source,/profiles\(display_name[^)]*scent_/)
  assert.doesNotMatch(source,/select\([^\n]*scent_avoided_notes/)
  assert.doesNotMatch(source,/select\([^\n]*scent_max_price/)
 })
}

test('community profile migration exposes only narrow public identity columns',()=>{
 const source=read('supabase/migrations/20261005220544_add_public_community_profiles.sql')
 const create=source.match(/create table if not exists public\.community_profiles \(([\s\S]*?)\n\);/)?.[1]||''
 assert.match(create,/user_id uuid/)
 assert.match(create,/display_name text/)
 assert.match(create,/taste_label text/)
 assert.match(create,/show_taste_badge boolean/)
 assert.doesNotMatch(create,/scent_loved_notes|scent_avoided_notes|scent_max_price/)
})
