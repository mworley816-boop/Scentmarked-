export type ScentProfileCompletionSignals={
 loved:string[]
 avoided:string[]
 favoriteIds:string[]
 presentations:string[]
 sweetness:number|null
 projection:number|null
 longevity:number|null
 budget:number
}

export function hasScentProfileRankingSignal(signals:ScentProfileCompletionSignals){
 const presentationSignal=!signals.presentations.includes('No preference')&&signals.presentations.length>0
 return signals.loved.length>0||signals.avoided.length>0||signals.favoriteIds.length>0||presentationSignal||signals.sweetness!=null||signals.projection!=null||signals.longevity!=null||(Number.isSafeInteger(signals.budget)&&signals.budget>0)
}
