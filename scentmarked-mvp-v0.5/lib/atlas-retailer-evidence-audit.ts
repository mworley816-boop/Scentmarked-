import 'server-only'
import {getCloudflareContext} from '@opennextjs/cloudflare'
import postgres from 'postgres'
import type {AtlasRetailerCandidate} from './atlas-retailer-candidates'

type Bindings={HYPERDRIVE?:{connectionString:string}}

/** Fail closed: research evidence must be stored privately before staging an offer. */
export type PrivateAuditFailure='binding_unavailable'|'connection_failed'|'insert_failed'|'unknown'
export type PrivateAuditResult={ok:true}|{ok:false;reason:PrivateAuditFailure}

export async function recordPrivateRetailerEvidence(candidate:AtlasRetailerCandidate):Promise<PrivateAuditResult>{
 let sql:ReturnType<typeof postgres>|undefined
 let phase:'binding'|'connection'|'insert'='binding'
 try{
  const context=await getCloudflareContext({async:true})
  const connectionString=(context.env as unknown as Bindings).HYPERDRIVE?.connectionString
  if(!connectionString)return {ok:false,reason:'binding_unavailable'}
  phase='connection'
  sql=postgres(connectionString,{max:1,connect_timeout:5,idle_timeout:5,ssl:false,prepare:false})
  await sql`SELECT 1`
  phase='insert'
  await sql`INSERT INTO atlas_private.retailer_evidence_audit
   (perfume_id,brand,perfume_name,merchant_name,product_url,source_url,evidence_note,observed_at,outcome,published,requires_admin_approval)
   VALUES (${candidate.perfume_id},${candidate.brand},${candidate.perfume_name},
    ${candidate.merchant_name},${candidate.product_url},${candidate.source_url},
    ${candidate.evidence_note},now(),'pending_review',false,true)`
  return {ok:true}
 }catch{
  return {ok:false,reason:phase==='binding'?'binding_unavailable':phase==='connection'?'connection_failed':phase==='insert'?'insert_failed':'unknown'}
 }
 finally{if(sql)await sql.end({timeout:1}).catch(()=>undefined)}
}
