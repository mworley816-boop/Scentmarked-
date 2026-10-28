import 'server-only'
import {getCloudflareContext} from '@opennextjs/cloudflare'
import {Client} from 'pg'
import {probeHyperdriveConnection, type HyperdriveProbeResult} from './hyperdrive-readonly-probe'

type HyperdriveBinding={connectionString:string}
type WorkerBindings={HYPERDRIVE?:HyperdriveBinding}

/**
 * A one-shot read-only probe. No public HTTP route calls this yet.
 * This runs only inside the Cloudflare Worker runtime, never at build time.
 * Hyperdrive manages the origin credentials; none are stored in source.
 */
export async function probeLiveHyperdrive():Promise<HyperdriveProbeResult>{
  let client:Client|undefined
  try{
    const context=await getCloudflareContext({async:true})
    const binding=(context.env as unknown as WorkerBindings).HYPERDRIVE
    if(!binding?.connectionString)return {ok:false,reason:'not_configured'}
    client=new Client({
      connectionString:binding.connectionString,
      connectionTimeoutMillis:5000,
      query_timeout:5000,
      ssl:false
    })
    await client.connect()
    return await probeHyperdriveConnection(async sql=>{
      const result=await client!.query<{reachable:number}>(sql)
      return {rows:result.rows}
    })
  }catch{
    return {ok:false,reason:'connection_failed'}
  }finally{
    if(client)await client.end().catch(()=>undefined)
  }
}
