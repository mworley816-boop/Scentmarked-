import { safeAuthNext } from './auth-redirect.ts'

// Pending onboarding data must never be applied on unrelated account actions.
export function isOnboardingCompletion(value:unknown){
 const next=safeAuthNext(value)
 if(next!=='/matches?profile=ready')return false
 return true
}
