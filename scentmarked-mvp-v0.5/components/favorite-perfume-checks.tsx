'use client'

import { useState } from 'react'

type PerfumeOption={id:string;name:string;brand?:string|null}

export default function FavoritePerfumeChecks({items,selected=[]}:{items:PerfumeOption[];selected?:string[]}){
 const initial=selected.filter(id=>items.some(item=>item.id===id)).slice(0,8)
 const initialSet=new Set(initial)
 const [chosen,setChosen]=useState(()=>new Set(initial))
 const saved=items.filter(item=>initialSet.has(item.id))
 const more=items.filter(item=>!initialSet.has(item.id))
 const toggle=(id:string,checked:boolean)=>setChosen(current=>{const next=new Set(current);if(checked){if(next.size>=8)return next;next.add(id)}else next.delete(id);return next})
 const grid=(options:PerfumeOption[])=><div className="quiz-check-grid">{options.map(item=>{const isChecked=chosen.has(item.id),atLimit=chosen.size>=8&&!isChecked;return <label className={'quiz-check'+(atLimit?' quiz-check-disabled':'')} key={item.id}><input type="checkbox" name="favoritePerfumes" value={item.id} checked={isChecked} disabled={atLimit} aria-disabled={atLimit} aria-describedby={atLimit?'favorite-limit-help':undefined} onChange={e=>toggle(item.id,e.target.checked)}/><span>{item.brand?item.brand+' · ':''}{item.name}</span></label>})}</div>
 return <div>
  <p className="quiz-selection-count" aria-live="polite"><strong>{chosen.size}/8</strong> selected{chosen.size>=8?' — uncheck one to choose another':''}</p>
  {saved.length>0&&<><h3>Your saved favorites</h3>{grid(saved)}<h3>More fragrances to choose from</h3></>}
  {grid(more)}
  {chosen.size>=8&&<p className="quiz-limit-note" id="favorite-limit-help">You’ve selected the maximum of 8 favorites. Uncheck one of your selected fragrances to make another choice available.</p>}
 </div>
}
