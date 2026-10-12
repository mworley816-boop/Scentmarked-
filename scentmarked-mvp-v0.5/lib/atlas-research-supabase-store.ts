import type {AtlasResearchQueueStore} from './atlas-research-repository'
import type {AtlasResearchStoredRow} from './atlas-research-storage'

type QueryResult<T>={data:T|null;error:{message:string}|null}
type SupabaseLike={
 from(table:'atlas_research_queue'):{
  select(columns:string):{order(column:string,options:{ascending:boolean}):Promise<QueryResult<AtlasResearchStoredRow[]>>}
  insert(row:AtlasResearchStoredRow):Promise<QueryResult<unknown>>
 }
}

export function createAtlasSupabaseQueueStore(client:SupabaseLike):AtlasResearchQueueStore{
 return {
  async list(){
   const result=await client.from('atlas_research_queue').select('*').order('submitted_at',{ascending:false})
   if(result.error)throw new Error('Atlas queue read failed: '+result.error.message)
   if(!Array.isArray(result.data))throw new Error('Atlas queue returned invalid data')
   return result.data
  },
  async insert(row){
   const result=await client.from('atlas_research_queue').insert(row)
   if(result.error)throw new Error('Atlas queue insert failed: '+result.error.message)
  }
 }
}
