import test from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'

const workflow=readFileSync('../.github/workflows/atlas-manufacturer-research-dry-run.yml','utf8')
const runner=readFileSync('scripts/atlas-manufacturer-research-dry-run.ts','utf8')

test('manufacturer workflow requires manual dispatch and only read access',()=>{
 assert.match(workflow,/workflow_dispatch:/)
 assert.match(workflow,/permissions:\s*\n\s*contents: read/)
 assert.doesNotMatch(workflow,/\b(?:schedule|push|pull_request):/)
})

test('manufacturer workflow invokes the reviewed dry-run script and only uploads artifacts',()=>{
 assert.match(workflow,/atlas-manufacturer-research-dry-run\.ts/)
 assert.match(workflow,/actions\/upload-artifact@/)
 assert.doesNotMatch(workflow,/\$\{\{\s*secrets\./)
 assert.doesNotMatch(workflow,/\bcurl\b|\bPOST\b|\bdeploy\b/i)
})

test('research runner uses reviewed source registry and does not submit or publish',()=>{
 assert.match(runner,/assessAtlasAutomatedResearchSource/)
 assert.match(runner,/prepareAtlasAutomatedResearch/)
 assert.doesNotMatch(runner,/createServiceSupabaseClient|SUPABASE_SERVICE_ROLE_KEY|fetch\(|\.insert\(|\.upsert\(/)
})
