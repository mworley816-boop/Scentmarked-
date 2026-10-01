'use client'

import {useEffect,useId,useMemo,useRef,useState} from 'react'

type PerfumeOption={id:string;name:string;slug:string;brand:string}

export default function PerfumeSearchPicker({name,label,options,selectedSlug,required=false}:{name:string;label:string;options:PerfumeOption[];selectedSlug?:string;required?:boolean}){
 const selected=options.find(x=>x.slug===selectedSlug)
 const [query,setQuery]=useState(selected?selected.brand+' — '+selected.name:'')
 const [value,setValue]=useState(selected?.slug||'')
 const [open,setOpen]=useState(false)
 const [activeIndex,setActiveIndex]=useState(-1)
 const inputId=useId()
 const listId=useId()
 const hintId=useId()
 const activeOption=useRef<HTMLButtonElement>(null)
 const matches=useMemo(()=>{const q=query.trim().toLowerCase();if(!q)return[];return options.filter(x=>(x.name+' '+x.brand).toLowerCase().includes(q)).slice(0,8)},[options,query])
 const expanded=open&&query.trim().length>0
 useEffect(()=>{
  setQuery(selected?selected.brand+' — '+selected.name:'')
  setValue(selected?.slug||'')
  setOpen(false)
  setActiveIndex(-1)
 },[selectedSlug,selected?.name,selected?.brand])
 useEffect(()=>{if(expanded)activeOption.current?.scrollIntoView({block:'nearest'})},[activeIndex,expanded])
 function choose(x:PerfumeOption){setQuery(x.brand+' — '+x.name);setValue(x.slug);setOpen(false);setActiveIndex(-1)}
 return <div className="perfume-search-picker">
  <label htmlFor={inputId}>{label}</label>
  <input type="hidden" name={name} value={value}/>
  <div className="perfume-search-box">
   <input id={inputId} role="combobox" value={query} required={required} pattern={required&&value?undefined:"(?!)"} title={required&&!value?"Choose a fragrance from the search results.":undefined} placeholder="Search perfume or brand…" autoComplete="off" aria-autocomplete="list" aria-describedby={required?hintId:undefined} aria-controls={expanded?listId:undefined} aria-expanded={expanded} aria-activedescendant={expanded&&matches[activeIndex]?listId+'-'+activeIndex:undefined}
    onFocus={()=>setOpen(true)}
    onBlur={()=>{setOpen(false);setActiveIndex(-1)}}
    onChange={e=>{setQuery(e.target.value);setValue('');setOpen(true);setActiveIndex(-1)}}
    onKeyDown={e=>{
     if(e.nativeEvent.isComposing)return
     if((e.key==='ArrowDown'||e.key==='ArrowUp')&&matches.length){
      e.preventDefault()
      setOpen(true)
      setActiveIndex(i=>!expanded||i<0?(e.key==='ArrowDown'?0:matches.length-1):Math.max(0,Math.min(matches.length-1,i+(e.key==='ArrowDown'?1:-1))))
     }else if(e.key==='Enter'&&expanded&&matches[activeIndex]){
      e.preventDefault()
      choose(matches[activeIndex])
     }else if(e.key==='Escape'&&expanded){
      e.preventDefault()
      setOpen(false)
      setActiveIndex(-1)
     }
    }}/>
   {required&&<span id={hintId} className="sr-only">Choose a fragrance from the search results.</span>}
   {expanded&&<div className="perfume-search-results" id={listId} role="listbox" aria-label={label}>{matches.length?matches.map((x,index)=><button type="button" role="option" id={listId+'-'+index} tabIndex={-1} ref={index===activeIndex?activeOption:undefined} aria-selected={index===activeIndex} key={x.id} onMouseDown={e=>e.preventDefault()} onClick={()=>choose(x)}><b>{x.name}</b><span>{x.brand}</span></button>):<p role="status">No matching fragrances.</p>}</div>}
  </div>
 </div>
}
