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

/** Attestations supplied as JSON or by an untrusted caller are not proof that
 * a network connection actually used a pinned IP and verified TLS hostname.
 * Keep this gate closed until a trusted transport implementation exists.
 */
export function assertAtlasVerifiedTransportUnavailable():never{
 throw new Error('Verified Atlas transport is unavailable: trusted pinned-IP HTTPS fetcher not configured')
}
