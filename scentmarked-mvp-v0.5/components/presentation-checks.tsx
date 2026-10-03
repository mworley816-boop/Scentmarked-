'use client'

import { useState } from 'react'

export default function PresentationChecks({items,selected=[]}:{items:string[];selected?:string[]}){
 const initial=selected.includes('No preference')?new Set(['No preference']):new Set(selected.filter(x=>items.includes(x)))
 const [chosen,setChosen]=useState(initial)
 const toggle=(item:string,checked:boolean)=>setChosen(current=>{
  const next=new Set(current)
  if(!checked){next.delete(item);return next}
  if(item==='No preference')return new Set(['No preference'])
  next.delete('No preference');next.add(item);return next
 })
 return <div className="quiz-check-grid">{items.map(item=><label className="quiz-check" key={item}><input type="checkbox" name="presentations" value={item} checked={chosen.has(item)} onChange={e=>toggle(item,e.target.checked)}/><span>{item}</span></label>)}</div>
}
