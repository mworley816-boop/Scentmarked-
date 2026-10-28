/**
 * Read-only, injection-based Hyperdrive probe. This helper does not expose
 * an HTTP endpoint, connect to production, or log connection credentials.
 * A trusted server-side caller must supply the actual database executor.
 */
export type HyperdriveProbeExecutor = (sql:'select 1 as reachable')=>Promise<{rows:readonly {reachable:unknown}[]}>
export type HyperdriveProbeResult = {ok:true}|{ok:false;reason:'not_configured'|'connection_failed'|'unexpected_result'}

export async function probeHyperdriveConnection(
  executor?:HyperdriveProbeExecutor
):Promise<HyperdriveProbeResult>{
  if(!executor)return {ok:false,reason:'not_configured'}
  try{
    const result=await executor('select 1 as reachable')
    if(result.rows.length!==1||Number(result.rows[0]?.reachable)!==1)
      return {ok:false,reason:'unexpected_result'}
    return {ok:true}
  }catch{
    // Do not expose driver errors, credentials or connection strings.
    return {ok:false,reason:'connection_failed'}
  }
}
