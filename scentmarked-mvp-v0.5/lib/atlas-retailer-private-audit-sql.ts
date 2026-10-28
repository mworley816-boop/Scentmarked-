import type {RetailerAuditInput,PrivateAuditWriter} from './atlas-retailer-private-audit'

export type ParameterizedAuditQuery={
  text:string
  values:[string,string,string,string,string,string,string,string]
}
/**
 * Query preparation only. No credentials or database connection are opened.
 * Parameter placeholders are mandatory: never interpolate research evidence.
 */
export function buildPrivateRetailerAuditInsert(record:RetailerAuditInput):ParameterizedAuditQuery{
  if(record.outcome!=='draft_created'&&record.outcome!=='duplicate')
    throw new Error('Unsupported audit outcome')
  return {
    text:`insert into atlas_private.retailer_evidence_audit
      (perfume_id,brand,perfume_name,merchant_name,product_url,source_url,evidence_note,observed_at,outcome)
      values ($1,$2,$3,$4,$5,$6,$7,now(),$8)
      returning id`,
    values:[record.perfume_id,record.brand,record.perfume_name,record.merchant_name,
      record.product_url,record.source_url,record.evidence_note,record.outcome]
  }
}
/**
 * Database driver injected by a trusted server-only caller. Does not
 * configure network access, poolers, secrets, or Cloudflare bindings.
 */
export function createPrivateAuditWriter(
  execute:(query:ParameterizedAuditQuery)=>Promise<{rows:readonly {id:unknown}[]}>
):PrivateAuditWriter{
  return async record=>{
    const result=await execute(buildPrivateRetailerAuditInsert(record))
    if(result.rows.length!==1||typeof result.rows[0]?.id!=='number'&&typeof result.rows[0]?.id!=='string')
      return {ok:false,reason:'audit_insert_not_confirmed'}
    return {ok:true}
  }
}
