import type {SupabaseClient} from '@supabase/supabase-js'
import type {ClaimedTask} from './atlas-worker-execution.ts'
import {runAtlasDatabaseWorker} from './atlas-worker-db-adapter.ts'
import {saveAtlasEvidenceDraft,type AtlasEvidenceDraftInput} from './atlas-evidence-draft-writer.ts'
import {validateAtlasResearchEvidence} from './atlas-research-evidence.ts'

// A trusted, explicitly invoked, one-assignment pipeline. The research provider
// must be injected by server code; no scheduler, browser route or publishing.
export async function runAtlasResearchDraftWorker(
 client:SupabaseClient,
 research:(task:ClaimedTask)=>Promise<AtlasEvidenceDraftInput>
){
 return runAtlasDatabaseWorker(client,async task=>{
  const proposal=await research(task)
  validateAtlasResearchEvidence({
   perfumeId:task.perfume_id,
   taskKind:task.task_kind,
   proposedText:proposal.proposedText,
   sources:proposal.sources,
   imageReference:proposal.imageReference
  })
  await saveAtlasEvidenceDraft(client,task,proposal)
  return {success:true}
 })
}
