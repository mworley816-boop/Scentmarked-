/** Required security properties of any future Atlas manufacturer-page transport.
 * The transport must prove these properties at runtime, not merely declare them.
 */
export type AtlasTransportSecurity={
 pinnedResolvedIp:boolean
 tlsHostnameVerified:boolean
 redirectRevalidated:boolean
 deadlineEnforced:boolean
 streamedByteLimitEnforced:boolean
}
export function assessAtlasTransportSecurity(input:AtlasTransportSecurity):{ready:boolean;missing:string[]}{
 const missing:(keyof AtlasTransportSecurity)[]=[]
 for(const key of ['pinnedResolvedIp','tlsHostnameVerified','redirectRevalidated','deadlineEnforced','streamedByteLimitEnforced'] as const){
  if(input[key]!==true)missing.push(key)
 }
 return {ready:missing.length===0,missing}
}
