import Link from 'next/link'

type Props={
 love:string[]
 avoid:string[]
 avoidExcluded:number
 budgetExcluded:number
 relaxHref:(remove:'love'|'avoid'|'budget',index?:number)=>string
}

export default function MatchEmptyState({love,avoid,avoidExcluded,budgetExcluded,relaxHref}:Props){
 return <div className="empty-state"><h2>No fragrances passed all of your filters.</h2><p>{avoidExcluded>0||budgetExcluded>0?'Loosen only the filter blocking results while keeping your other scent preferences.':'Try broadening your scent preferences to see more matches.'}</p>{(avoidExcluded>0||budgetExcluded>0||love.length>0)&&<div className="result-actions">{avoidExcluded>0&&avoid.map((term,i)=><Link key={term+'-'+i} href={relaxHref('avoid',i)}>Allow {term}</Link>)}{budgetExcluded>0&&<Link href={relaxHref('budget')}>Remove budget limit</Link>}{avoidExcluded===0&&budgetExcluded===0&&love.map((term,i)=><Link key={term+'-'+i} href={relaxHref('love',i)}>Remove {term}</Link>)}</div>}</div>
}
