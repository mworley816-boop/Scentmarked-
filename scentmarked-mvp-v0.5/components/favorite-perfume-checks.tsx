'use client'

import { useState } from 'react'

type PerfumeOption={id:string;name:string;brand?:string|null}

export default function FavoritePerfumeChecks({items,selected=[]}:{items:PerfumeOption[];selected?:string[]}){
 const initial=selected.filter(id=>items.some(item=>item.id===id)).slice(0,8)
 const [chosen,setChosen]=useState(()=>new Set(initial))
 const toggle=(id:string,checked:boolean)=>setChosen(current=>{const next=new Set(current);if(checked){if(next.size>=8)return next;next.add(id)}else next.delete(id);return next})
 return <div>
  <p className="quiz-selection-count" aria-live="polite"><strong>{chosen.size}/8</strong> selected</p>
  <div className="quiz-check-grid">{items.map(item=>{const isChecked=chosen.has(item.id),atLimit=chosen.size>=8&&!isChecked;return <label className={'quiz-check'+(atLimit?' quiz-check-disabled':'')} key={item.id}><input type="checkbox" name="favoritePerfumes" value={item.id} checked={isChecked} disabled={atLimit} onChange={e=>toggle(item.id,e.target.checked)}/><span>{item.brand?item.brand+' · ':''}{item.name}</span></label>})}</div>
  {chosen.size>=8&&<p className="quiz-limit-note">You’ve selected 8 favorites. Uncheck one to choose another.</p>}
 </div>
}
