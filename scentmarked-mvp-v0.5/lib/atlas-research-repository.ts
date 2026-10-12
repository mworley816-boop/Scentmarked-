import type {AtlasResearchReviewRecord} from './atlas-research-review'
import {serializeAtlasResearchRow,deserializeAtlasResearchRow,type AtlasResearchStoredRow} from './atlas-research-storage.ts'

export interface AtlasResearchQueueStore {
 list():Promise<AtlasResearchStoredRow[]>
 insert(row:AtlasResearchStoredRow):Promise<void>
}

export async function submitAtlasResearchForReview(
 store:AtlasResearchQueueStore,
 record:AtlasResearchReviewRecord
):Promise<AtlasResearchStoredRow>{
 if(record.status!=='needs_source_review'&&record.status!=='duplicate')throw new Error('Only unreviewed research may be submitted')
 if(record.reviewedAt!==null||record.reviewedBy!==null)throw new Error('Submission already has review metadata')
 const rows=await store.list()
 if(rows.some(row=>row.id===record.id))throw new Error('Research submission ID already exists')
 const row=serializeAtlasResearchRow(record)
 await store.insert(row)
 return row
}

export async function loadAtlasResearchQueue(store:Pick<AtlasResearchQueueStore,'list'>):Promise<AtlasResearchReviewRecord[]>{
 return (await store.list()).map(deserializeAtlasResearchRow)
}
