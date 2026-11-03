import test from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
const sql=readFileSync(new URL('../supabase/migrations/20261103190000_atlas_persistent_employee_tasks.sql',import.meta.url),'utf8')
test('employee queue is private and claim function uses locking',()=>{
 assert.match(sql,/enable row level security/i)
 assert.match(sql,/revoke all on public\.atlas_employee_tasks from public,anon,authenticated/i)
 assert.match(sql,/for update of t skip locked/i)
 assert.match(sql,/unique\(perfume_id,task_kind\)/i)
})
test('graphics require approval and completion does not publish images',()=>{
 assert.match(sql,/atlas_graphics_must_require_approval/i)
 assert.match(sql,/then 'awaiting_review' else 'completed'/i)
 assert.doesNotMatch(sql,/update public\.perfumes/i)
})
test('task completion checks current lease ownership',()=>{
 assert.match(sql,/t\.lease_token=p_lease_token/i)
 assert.match(sql,/t\.leased_until>=pg_catalog\.now\(\)/i)
})
