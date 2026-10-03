'use client'

import { useState } from 'react'

type Props={items:string[];loved?:string[];avoided?:string[]}

export default function NotePreferenceChecks({items,loved=[],avoided=[]}:Props){
 const [love,setLove]=useState(()=>new Set(loved.filter(x=>items.includes(x))))
 const [avoid,setAvoid]=useState(()=>new Set(avoided.filter(x=>items.includes(x))))
 const toggle=(kind:'love'|'avoid',item:string,checked:boolean)=>{
  if(kind==='love'){
   setLove(current=>{const next=new Set(current);checked?next.add(item):next.delete(item);return next})
   if(checked)setAvoid(current=>{const next=new Set(current);next.delete(item);return next})
  }else{
   setAvoid(current=>{const next=new Set(current);checked?next.add(item):next.delete(item);return next})
   if(checked)setLove(current=>{const next=new Set(current);next.delete(item);return next})
  }
 }
 const group=(kind:'love'|'avoid',chosen:Set<string>)=><div className="quiz-check-grid">{items.map(item=><label className="quiz-check" key={item}><input type="checkbox" name={kind==='love'?'lovedNotes':'avoidedNotes'} value={item} checked={chosen.has(item)} onChange={e=>toggle(kind,item,e.target.checked)}/><span>{item}</span></label>)}</div>
 return <><h3>Loved notes</h3>{group('love',love)}<h3>Avoided notes</h3><p>Leave these unchecked if you’re not sure yet.</p>{group('avoid',avoid)}</>
}
