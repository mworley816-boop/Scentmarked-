import {assessAtlasFetchTarget,assessAtlasRedirectTarget} from './atlas-source-evidence.ts'
import {assessAtlasDnsResolution,type AtlasDnsRecord} from './atlas-dns-resolution-policy.ts'
import {assessAtlasFetchBudget,type AtlasFetchBudget} from './atlas-fetch-budget.ts'

/** Validates a proposed hop before a transport opens a connection.
 * A production transport MUST pin the connection to a vetted resolved IP.
 * This function does not fetch or claim to prevent DNS rebinding by itself.
 */
export type AtlasHopDecision={allowed:boolean;targetUrl:string|null;reasons:string[]}
export function assessAtlasResearchHop(input:{
 previousUrl?:string
 target:string
 resolvedAddresses:readonly AtlasDnsRecord[]
 budget:AtlasFetchBudget
}):AtlasHopDecision{
 const reasons:string[]=[]
 let targetUrl:string|null=null
 if(input.previousUrl){
  const redirect=assessAtlasRedirectTarget(input.previousUrl,input.target)
  reasons.push(...redirect.reasons)
  targetUrl=redirect.targetUrl
 }else{
  const preflight=assessAtlasFetchTarget(input.target)
  reasons.push(...preflight.reasons)
  if(preflight.allowed)targetUrl=input.target
 }
 if(targetUrl)reasons.push(...assessAtlasDnsResolution(targetUrl,input.resolvedAddresses).reasons)
 reasons.push(...assessAtlasFetchBudget(input.budget).reasons)
 return {allowed:reasons.length===0,targetUrl:reasons.length===0?targetUrl:null,reasons}
}
