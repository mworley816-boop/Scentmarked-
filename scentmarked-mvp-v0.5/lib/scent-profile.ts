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
 return signals.loved.length>0||signals.avoided.length>0||signals.favoriteIds.length>0||signals.presentations.some(x=>x!=='No preference')||signals.sweetness!=null||signals.projection!=null||signals.longevity!=null||(Number.isSafeInteger(signals.budget)&&signals.budget>0)
}
