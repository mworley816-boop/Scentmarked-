import {ATLAS_MAX_REDIRECTS,ATLAS_MAX_SOURCE_BYTES} from './atlas-research-response-policy.ts'

/** Hard limits for a future vetted transport; no network requests occur here. */
export const ATLAS_FETCH_TIMEOUT_MS=8_000
export type AtlasFetchBudget={redirects:number;elapsedMs:number;receivedBytes:number}
export function assessAtlasFetchBudget(budget:AtlasFetchBudget):{allowed:boolean;reasons:string[]}{
 const reasons:string[]=[]
 if(!Number.isSafeInteger(budget.redirects)||budget.redirects<0||budget.redirects>ATLAS_MAX_REDIRECTS)reasons.push('Redirect limit exceeded')
 if(!Number.isFinite(budget.elapsedMs)||budget.elapsedMs<0||budget.elapsedMs>=ATLAS_FETCH_TIMEOUT_MS)reasons.push('Research fetch deadline exceeded')
 if(!Number.isSafeInteger(budget.receivedBytes)||budget.receivedBytes<0||budget.receivedBytes>ATLAS_MAX_SOURCE_BYTES)reasons.push('Research fetch byte limit exceeded')
 return {allowed:reasons.length===0,reasons}
}
