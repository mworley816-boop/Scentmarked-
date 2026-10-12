import {assessAtlasFetchTarget,isAllowedAtlasResolvedIp} from './atlas-source-evidence.ts'

/** Fail-closed DNS preflight. A network client must connect to a pinned vetted
 * address and repeat validation at each redirect to prevent DNS rebinding.
 */
export type AtlasDnsRecord={address:string;family:4|6}
export function assessAtlasDnsResolution(url:string,records:readonly AtlasDnsRecord[]):{allowed:boolean;reasons:string[]}{
 const reasons=[...assessAtlasFetchTarget(url).reasons]
 if(!records.length)reasons.push('No DNS addresses resolved')
 if(records.length>32)reasons.push('Too many DNS addresses')
 for(const record of records){
  if(record.family!==4||!isAllowedAtlasResolvedIp(record.address))reasons.push('Unsafe or unsupported resolved address')
 }
 return {allowed:reasons.length===0,reasons:[...new Set(reasons)]}
}
