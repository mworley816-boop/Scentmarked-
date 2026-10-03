'use client'

import { useState } from 'react'

type Props={items:string[];loved?:string[];avoided?:string[]}

export default function NotePreferenceChecks({items,loved=[],avoided=[]}:Props){
 const itemByKey=new Map(items.map(item=>[item.toLocaleLowerCase(),item]))
 const initialAvoid=new Set(avoided.map(x=>itemByKey.get(x.toLocaleLowerCase())).filter((x):x is string=>!!x))
 const avoidKeys=new Set([...initialAvoid].map(x=>x.toLocaleLowerCase()))
 const [avoid,setAvoid]=useState(()=>initialAvoid)
 const [love,setLove]=useState(()=>new Set(loved.map(x=>itemByKey.get(x.toLocaleLowerCase())).filter((x):x is string=>!!x&&!avoidKeys.has(x.toLocaleLowerCase()))))
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
 return <><fieldset><legend>2. Which notes do you love?</legend><p>Choosing a note here removes it from your avoid list.</p>{group('love',love)}</fieldset><fieldset><legend>3. Which notes do you usually avoid?</legend><p>Choosing a note here removes it from your loved notes. Leave these unchecked if you’re not sure yet.</p>{group('avoid',avoid)}</fieldset></>
}
