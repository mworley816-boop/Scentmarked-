import type {AtlasRetailerCandidate} from './atlas-retailer-candidates'

export type RetailerAuditOutcome='draft_created'|'duplicate'
export type RetailerAuditInput={
  perfume_id:string;brand:string;perfume_name:string;merchant_name:string;
  product_url:string;source_url:string;evidence_note:string;outcome:RetailerAuditOutcome
}
export type PrivateAuditWriter=(record:RetailerAuditInput)=>Promise<{ok:true}|{ok:false;reason:string}>

/**
 * Server-side bridge contract only. The private atlas_private schema is not
 * exposed to the Supabase Data API. Do NOT use .schema('atlas_private') with
 * the browser client, create a public RLS bypass, or log evidence/credentials.
 * A separately configured, privileged server-side database transport must
 * supply the writer. Until then, callers must fail closed.
 */
export async function recordPrivateRetailerAudit(
  candidate:AtlasRetailerCandidate,
  outcome:RetailerAuditOutcome,
  writer?:PrivateAuditWriter
):Promise<{ok:true}|{ok:false;reason:string}>{
  if(!writer)return {ok:false,reason:'private_audit_writer_not_configured'}
  const record:RetailerAuditInput={
    perfume_id:candidate.perfume_id,brand:candidate.brand,
    perfume_name:candidate.perfume_name,merchant_name:candidate.merchant_name,
    product_url:candidate.product_url,source_url:candidate.source_url,
    evidence_note:candidate.evidence_note,outcome
  }
  try{
    const result=await writer(record)
    return result.ok?{ok:true}:{ok:false,reason:'private_audit_write_failed'}
  }catch{return {ok:false,reason:'private_audit_write_failed'}}
}
