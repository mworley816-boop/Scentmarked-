/**
 * Authentication gate for the read-only diagnostic. The shared secret is
 * configured server-side; never pass it in a URL or log it.
 */
export async function authorizeHyperdriveDiagnostic(
  authorization:string|null,
  configuredSecret:string|undefined
):Promise<boolean>{
  if(!configuredSecret||configuredSecret.length<32)return false
  const match=/^Bearer ([^\s]+)$/.exec(authorization||'')
  if(!match)return false
  const supplied=match[1]
  const encoder=new TextEncoder()
  const key=await crypto.subtle.importKey('raw',encoder.encode(configuredSecret),
    {name:'HMAC',hash:'SHA-256'},false,['sign'])
  const [expected,actual]=await Promise.all([
    crypto.subtle.sign('HMAC',key,encoder.encode(configuredSecret)),
    crypto.subtle.sign('HMAC',key,encoder.encode(supplied))
  ])
  const a=new Uint8Array(expected),b=new Uint8Array(actual)
  let diff=0
  for(let i=0;i<a.length;i++)diff|=a[i]^b[i]
  return diff===0
}
