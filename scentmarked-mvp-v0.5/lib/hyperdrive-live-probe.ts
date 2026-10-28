import 'server-only'
import {getCloudflareContext} from '@opennextjs/cloudflare'
import postgres from 'postgres'
import {probeHyperdriveConnection, type HyperdriveProbeResult} from './hyperdrive-readonly-probe'

type WorkerBindings={HYPERDRIVE?:{connectionString:string}}

/** Read-only Cloudflare Hyperdrive probe; never logs connection details. */
export async function probeLiveHyperdrive():Promise<HyperdriveProbeResult>{
  let sql:ReturnType<typeof postgres>|undefined
  try{
    const context=await getCloudflareContext({async:true})
    const binding=(context.env as unknown as WorkerBindings).HYPERDRIVE
    if(!binding?.connectionString)return {ok:false,reason:'not_configured'}
    sql=postgres(binding.connectionString,{
      max:1,
      connect_timeout:5,
      idle_timeout:5,
      ssl:false,
      prepare:false
    })
    return await probeHyperdriveConnection(async query=>{
      if(!sql)throw new Error('Connection unavailable')
      const rows=await sql.unsafe(query)
      return {rows:rows.map(row=>({reachable:row.reachable}))}
    })
  }catch{
    return {ok:false,reason:'connection_failed'}
  }finally{
    if(sql)await sql.end({timeout:1}).catch(()=>undefined)
  }
}
