import Link from 'next/link'

type MatchHistoryPerfume={id:string;name:string;slug:string;brands?:{name?:string|null}|null}

export default function MatchHistoryResults({perfumes}:{perfumes?:MatchHistoryPerfume[]}){
 if(!perfumes?.length)return null
 return <div className="match-history-results"><small>Top matches</small><div className="result-actions">{perfumes.map(p=><Link className="text-link" href={'/perfume/'+p.slug} key={p.id}>{p.brands?.name?p.brands.name+' — ':''}{p.name}</Link>)}</div></div>
}
