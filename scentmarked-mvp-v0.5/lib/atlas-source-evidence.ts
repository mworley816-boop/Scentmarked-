import type {PerfumeResearchCandidate} from './atlas-research-intake.ts'

export type AtlasSourceEvidence={
 manufacturerUrl:string
 observedUrl:string
 pageTitle:string
 fetchedAt:string
}
export type AtlasSourceAssessment={
 metadataConsistent:boolean
 reasons:string[]
 evidence:AtlasSourceEvidence
}

// Prevent local/private network targets before a future automated research fetcher is added.
// This check is only a first layer: any fetcher must also validate resolved IPs and redirects.
export function isPublicSourceHost(hostname:string):boolean{
 const host=hostname.toLowerCase().replace(/\.$/,'')
 if(!host||host==='localhost'||host.endsWith('.localhost')||host.endsWith('.local')||host.endsWith('.internal'))return false
 if(!host.includes('.'))return false
 if(host.startsWith('[')||/^\d+\.\d+\.\d+\.\d+$/.test(host))return false
 return true
}

// Evidence validation does not prove that a website belongs to a manufacturer.
// A reviewer must independently establish manufacturer ownership.
export function assessAtlasSourceEvidence(candidate:PerfumeResearchCandidate,evidence:AtlasSourceEvidence):AtlasSourceAssessment{
 const reasons:string[]=[]
 if(evidence.manufacturerUrl!==candidate.manufacturerUrl)reasons.push('Evidence source URL does not match candidate')
 let submitted:URL|null=null
 let observed:URL|null=null
 try{submitted=new URL(candidate.manufacturerUrl)}catch{}
 try{observed=new URL(evidence.observedUrl)}catch{}
 if(!submitted||submitted.protocol!=='https:'||submitted.username||submitted.password||submitted.port)reasons.push('Submitted source URL is not a safe HTTPS URL')
 if(!observed||observed.protocol!=='https:'||observed.username||observed.password||observed.port)reasons.push('Observed source URL is not a safe HTTPS URL')
 if(submitted&&!isPublicSourceHost(submitted.hostname))reasons.push('Submitted source host is not a public domain')
 if(observed&&!isPublicSourceHost(observed.hostname))reasons.push('Observed source host is not a public domain')
 if(submitted&&observed&&submitted.hostname.toLowerCase().replace(/\.$/,'')!==observed.hostname.toLowerCase().replace(/\.$/,''))reasons.push('Observed source host differs from submitted source')
 if(submitted&&observed&&submitted.origin!==observed.origin)reasons.push('Observed source origin differs from submitted source')
 if(!evidence.pageTitle.trim())reasons.push('Page title is missing')
 const timestamp=Date.parse(evidence.fetchedAt)
 if(!Number.isFinite(timestamp)||timestamp>Date.now()+60_000||timestamp<Date.now()-1000*60*60*24*365)reasons.push('Evidence timestamp is invalid')
 return {metadataConsistent:reasons.length===0,reasons,evidence}
}

/** Preflight policy only. Fetchers must additionally reject private DNS resolutions and validate every redirect hop. */
export function assessAtlasFetchTarget(rawUrl:string):{allowed:boolean;reasons:string[]}{
 const reasons:string[]=[]
 let parsed:URL|null=null
 try{parsed=new URL(rawUrl)}catch{}
 if(!parsed||parsed.protocol!=='https:'||parsed.username||parsed.password||parsed.port)reasons.push('Fetch target must use HTTPS without credentials or custom ports')
 if(parsed&&!isPublicSourceHost(parsed.hostname))reasons.push('Fetch target must use a public domain')
 if(parsed&&(parsed.hostname.endsWith('.')||parsed.hash))reasons.push('Fetch target must not contain a trailing-dot host or fragment')
 return {allowed:reasons.length===0,reasons}
}

/** Validate each redirect before following it; the network layer must separately check resolved IPs. */
export function assessAtlasRedirectTarget(previousUrl:string,location:string):{allowed:boolean;targetUrl:string|null;reasons:string[]}{
 const reasons:string[]=[]
 let next:URL
 try{next=new URL(location,previousUrl)}catch{return {allowed:false,targetUrl:null,reasons:['Invalid redirect location']}}
 const check=assessAtlasFetchTarget(next.href)
 reasons.push(...check.reasons)
 const prior=assessAtlasFetchTarget(previousUrl)
 if(!prior.allowed)reasons.push('Previous fetch URL is unsafe')
 return {allowed:reasons.length===0,targetUrl:reasons.length===0?next.href:null,reasons}
}

/** Reject private, loopback, link-local, multicast and special-use IPs after DNS lookup.
 * The caller must verify every resolved A/AAAA record and ensure the actual connection
 * uses a vetted address; DNS rebinding is not prevented by preflight alone.
 */
export function isAllowedAtlasResolvedIp(address:string):boolean{
 const ipv4=address.split('.')
 if(ipv4.length===4&&ipv4.every(x=>/^\d{1,3}$/.test(x)&&Number(x)<=255)){
  const [a,b,c]=ipv4.map(Number)
  if(a===0||a===10||a===127||a>=224||a===169&&b===254||a===172&&b>=16&&b<=31||a===192&&b===168||a===100&&b>=64&&b<=127||a===192&&b===0||a===198&&(b===18||b===19)||a===192&&b===0&&c===2||a===198&&b===51&&c===100||a===203&&b===0&&c===113)return false
  return true
 }
 // Fail closed for IPv6 until the network layer has a trusted IPv6 parser.
 return false
}
