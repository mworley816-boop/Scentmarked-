import 'server-only'
import {getCloudflareContext} from '@opennextjs/cloudflare'
import postgres from 'postgres'

export type RetailerAuditEvidence={
 perfume_id:string;product_url:string;merchant_name:string;source_url:string;
 evidence_note:string;observed_at:string;outcome:string
}
type Bindings={HYPERDRIVE?:{connectionString:string}}
/** Admin-only caller: retrieve limited private evidence, never expose via a public endpoint. */
export async function getRetailerAuditEvidence():Promise<{rows:RetailerAuditEvidence[];available:boolean}>{
 let sql:ReturnType<typeof postgres>|undefined
 try{
  const ctx=await getCloudflareContext({async:true})
  const connectionString=(ctx.env as unknown as Bindings).HYPERDRIVE?.connectionString
  if(!connectionString)return {rows:[],available:false}
  sql=postgres(connectionString,{max:1,connect_timeout:5,idle_timeout:5,ssl:false,prepare:false})
  const rows=await sql<RetailerAuditEvidence[]>`SELECT perfume_id::text,product_url,merchant_name,source_url,evidence_note,
   observed_at::text,outcome FROM atlas_private.retailer_evidence_audit
   WHERE requires_admin_approval=true ORDER BY created_at DESC LIMIT 200`
  return {rows:[...rows],available:true}
 }catch{return {rows:[],available:false}}
 finally{if(sql)await sql.end({timeout:1}).catch(()=>undefined)}
}
