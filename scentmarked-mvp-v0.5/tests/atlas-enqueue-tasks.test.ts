import test from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
const sql=readFileSync(new URL('../supabase/migrations/20261103210000_atlas_enqueue_catalog_employee_tasks.sql',import.meta.url),'utf8')
test('catalog task enqueue is private and idempotent',()=>{
 assert.match(sql,/security invoker/i)
 assert.match(sql,/revoke all on function public\.atlas_enqueue_catalog_employee_tasks\(integer\) from public,anon,authenticated/i)
 assert.match(sql,/grant execute on function public\.atlas_enqueue_catalog_employee_tasks\(integer\) to service_role/i)
 assert.match(sql,/on conflict\(perfume_id,task_kind\) do nothing/i)
})
test('archived catalog entries are excluded and graphics require approval',()=>{
 assert.match(sql,/p\.status<>'archived'/i)
 assert.match(sql,/research_graphic','verify_image_rights/i)
 assert.match(sql,/as requires_approval/i)
})
test('enqueue does not publish or modify existing tasks',()=>{
 assert.doesNotMatch(sql,/update public\.perfumes/i)
 assert.doesNotMatch(sql,/update public\.atlas_employee_tasks/i)
 assert.match(sql,/p_limit not between 1 and 5000/i)
})
