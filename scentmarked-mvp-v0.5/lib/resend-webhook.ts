const encoder=new TextEncoder()

function base64Bytes(value:string){
  const normalized=value.replace(/-/g,'+').replace(/_/g,'/')
  const binary=atob(normalized)
  return Uint8Array.from(binary,c=>c.charCodeAt(0))
}

function equalBytes(a:Uint8Array,b:Uint8Array){
  if(a.length!==b.length)return false
  let diff=0
  for(let i=0;i<a.length;i++)diff|=a[i]^b[i]
  return diff===0
}

export async function verifyResendWebhook(payload:string,headers:Headers,secret:string){
  const id=headers.get('svix-id')||''
  const timestamp=headers.get('svix-timestamp')||''
  const signatures=(headers.get('svix-signature')||'').split(' ').map(x=>x.split(',')).filter(x=>x.length===2&&x[0]==='v1').map(x=>x[1])
  if(!id||!timestamp||!signatures.length||!secret.startsWith('whsec_'))return false
  const seconds=Number(timestamp)
  if(!Number.isFinite(seconds)||Math.abs(Date.now()/1000-seconds)>300)return false
  const key=base64Bytes(secret.slice(6))
  const cryptoKey=await crypto.subtle.importKey('raw',key,{name:'HMAC',hash:'SHA-256'},false,['sign'])
  const signed=encoder.encode(id+'.'+timestamp+'.'+payload)
  const expected=new Uint8Array(await crypto.subtle.sign('HMAC',cryptoKey,signed))
  return signatures.some(sig=>{try{return equalBytes(expected,base64Bytes(sig))}catch{return false}})
}
