import Link from 'next/link'
import MatchHistoryResults from '@/components/match-history-results'

type Perfume={id:string;name:string;slug:string;brands?:{name?:string|null}|null}
type HistoryRow={id:number|string;perfume_slug?:string|null;loved_terms?:string[]|null;avoided_terms?:string[]|null;sweetness?:number|null;projection?:number|null;longevity?:number|null;max_price?:number|null;created_at:string;reference?:Perfume|null;top_results?:Perfume[]}

export default function MatchHistoryCard({row}:{row:HistoryRow}){
 const q=new URLSearchParams()
 if(row.perfume_slug)q.set('perfume',row.perfume_slug)
 if(row.loved_terms?.length)q.set('love',row.loved_terms.join(', '))
 if(row.avoided_terms?.length)q.set('avoid',row.avoided_terms.join(', '))
 if(row.sweetness)q.set('sweetness',String(row.sweetness))
 if(row.projection)q.set('projection',String(row.projection))
 if(row.longevity)q.set('longevity',String(row.longevity))
 if(row.max_price)q.set('maxPrice',String(row.max_price))
 const reference=row.reference?((row.reference.brands?.name?row.reference.brands.name+' — ':'')+row.reference.name):(row.perfume_slug?'Reference scent':'Preferences only')
 const wear=[row.sweetness?'Sweetness '+row.sweetness+'/5':'',row.projection?'Projection '+row.projection+'/5':'',row.longevity?'Longevity '+row.longevity+'/5':''].filter(Boolean).join(' · ')
 const summary=[reference,row.loved_terms?.length?'Love: '+row.loved_terms.join(', '):'',row.avoided_terms?.length?'Avoid: '+row.avoided_terms.join(', '):'',wear,row.max_price?'Budget: $'+row.max_price:''].filter(Boolean)
 return <article className="collection-card"><small>{new Intl.DateTimeFormat('en-US',{month:'short',day:'numeric',year:'numeric'}).format(new Date(row.created_at))}</small><h3>{row.perfume_slug?'Scent match search':'Preference match search'}</h3><p>{summary.join(' · ')}</p><MatchHistoryResults perfumes={row.top_results}/><Link className="button ghost" href={'/matches?'+q.toString()}>Run Again →</Link></article>
}
