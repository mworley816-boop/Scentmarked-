'use client'

import {useId,useMemo,useState} from 'react'

type PerfumeOption={id:string;name:string;slug:string;brand:string}

export default function PerfumeSearchPicker({name,label,options,selectedSlug}:{name:string;label:string;options:PerfumeOption[];selectedSlug?:string}){
 const selected=options.find(x=>x.slug===selectedSlug)
 const [query,setQuery]=useState(selected?selected.brand+' — '+selected.name:'')
 const [value,setValue]=useState(selected?.slug||'')
 const [open,setOpen]=useState(false)
 const listId=useId()
 const matches=useMemo(()=>{const q=query.trim().toLowerCase();if(!q)return[];return options.filter(x=>(x.name+' '+x.brand).toLowerCase().includes(q)).slice(0,8)},[options,query])
 function choose(x:PerfumeOption){setQuery(x.brand+' — '+x.name);setValue(x.slug);setOpen(false)}
 return <div className="perfume-search-picker">
  <label>{label}</label>
  <input type="hidden" name={name} value={value}/>
  <div className="perfume-search-box">
   <input value={query} placeholder="Search perfume or brand…" autoComplete="off" aria-autocomplete="list" aria-controls={listId} aria-expanded={open&&matches.length>0} onFocus={()=>setOpen(true)} onChange={e=>{setQuery(e.target.value);setValue('');setOpen(true)}}/>
   {open&&query.trim()&&<div className="perfume-search-results" id={listId} role="listbox">{matches.length?matches.map(x=><button type="button" role="option" aria-selected={x.slug===value} key={x.id} onMouseDown={e=>e.preventDefault()} onClick={()=>choose(x)}><b>{x.name}</b><span>{x.brand}</span></button>):<p>No matching fragrances.</p>}</div>}
  </div>
 </div>
}
